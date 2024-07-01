import { Types } from "mongoose";
import UserModelModel from "../models/user.model";
import { connectionFactory } from "../utils/connector.utils";
import ItemModelModel from "../models/item.model";
import MigrationModelModel from "../models/migration.model";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { ErrorList } from "../data/error-list";
import { StockInInterface } from "../interfaces/stock-in.interface";
import BillModelModel from "../models/bill.model";
import { redisClient } from "../app";
import MembershipModelModel from "../models/membership.model";
import { queue } from "../utils/queue.utils";
import moment from "moment";
import StockInModelModel from "../models/stock-in.model";
import StockModelModel from "../models/stock.model";
import StockCardModelModel from "../models/stock-card.model";
import OverflowModelModel from "../models/overflow.model";
import { StockOutInterface } from "../interfaces/stock-out.interface";
import StockOutModelModel from "../models/stock-out.model";
import { Mutex } from "async-mutex";

const mutex = new Mutex();
class WorkerController {
  static createProduct(data: any): void {
    ItemModelModel.fetchByID(data.id)
      .then(async (result) => {
        if (result) {
          new LoggerHelper({
            type: LoggerType.info,
            message: `Product ${result.reference} created`,
            tag: "Worker",
          }).log();

          return await MigrationModelModel.createProduct({
            reference: result.reference,
            description: result.description,
            barcode: result.barcode == undefined ? null : result.barcode,
            brand:
              typeof result.itemBrandID != "string"
                ? (result.itemBrandID as any).name
                : "",
            type:
              typeof result.itemTypeID != "string"
                ? (result.itemTypeID as any).name
                : "",
            brandID:
              typeof result.itemBrandID == "string"
                ? result.itemBrandID
                : (result.itemBrandID as any)._id,
            typeID:
              typeof result.itemTypeID == "string"
                ? result.itemTypeID
                : (result.itemTypeID as any)._id,
            price: result.price,
            id: result._id.toString(),
            isActive: result.isActive,
            images: result.images,
          });
        } else {
          new LoggerHelper({
            type: LoggerType.error,
            message: `Unable to find item with id ${data.toString()}`,
            tag: "Worker",
          }).log();
          throw Error(ErrorList["ITEM_NOT_FOUND"]);
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on creating product ${error}`,
          tag: "Worker",
        }).log();

        throw Error(error);
      });
  }

  static updateProduct(data: any): any {
    ItemModelModel.fetchByID(data.id)
      .then(async (result) => {
        if (result) {
          try {
            return await MigrationModelModel.updateProduct({
              reference: result.reference,
              description: result.description,
              barcode: result.barcode == undefined ? null : result.barcode,
              brand:
                typeof result.itemBrandID != "string"
                  ? (result.itemBrandID as any).name
                  : "",
              type:
                typeof result.itemTypeID != "string"
                  ? (result.itemTypeID as any).name
                  : "",
              brandID:
                typeof result.itemBrandID == "string"
                  ? result.itemBrandID
                  : (result.itemBrandID as any)._id,
              typeID:
                typeof result.itemTypeID == "string"
                  ? result.itemTypeID
                  : (result.itemTypeID as any)._id,
              price: result.price,
              id: result._id.toString(),
              isActive: result.isActive,
              images: [],
            });
          } catch (error) {
            new LoggerHelper({
              type: LoggerType.error,
              message: `Error on updating migration for product ${error}`,
              tag: "Worker",
            }).log();
            throw error;
          }
        } else {
          new LoggerHelper({
            type: LoggerType.error,
            message: `Product with id ${data} not found`,
            tag: "Worker",
          });
          throw new Error("Product not found");
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on creating fetching product ${error}`,
          tag: "Worker",
        }).log();
        throw new Error(error);
      });
  }

  static updateProductImages(data: any): any {
    const id = data.id;
    const images = data.images as string[];

    MigrationModelModel.updateProductImages({
      id,
      images: images,
    });
  }

  static createUser(data: any) {
    UserModelModel.fetchByID(data.id)
      .then((user) => {
        if (!user) {
          throw Error(ErrorList["USER_NOT_FOUND"]);
        } else {
          MigrationModelModel.createUser({
            name: user.name,
            userID: user._id!.toString(),
            code: user.code,
          });
        }
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  static updateUser(data: any) {
    UserModelModel.fetchByID(data.id)
      .then((user) => {
        if (!user) {
          throw Error(ErrorList["USER_NOT_FOUND"]);
        } else {
          MigrationModelModel.updateUser({
            name: user.name,
            userID: user._id!.toString(),
            code: user.code,
          });
        }
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  static deleteUser(data: any) {
    MigrationModelModel.deleteUser(data.id)
      .then((result) => {
        return result;
      })
      .catch((error) => {
        throw Error(error);
      });
  }

  static createBill(data: any) {
    BillModelModel.fetchByID(data.id).then(async (result) => {
      if (!result) {
        throw Error(ErrorList["BILL_NOT_FOUND"]);
      } else {
        if (result.memberID != null) {
          const conversion = await redisClient.get("conversion");
          const value = result.items.reduce((acc: number, item: any) => {
            return acc + (item.price - item.discount) * item.quantity;
          }, 0);

          const point =
            Number(conversion) == 0
              ? 0
              : Math.floor(value / Number(conversion));

          await MembershipModelModel.updatePoint(result.memberID, point);

          const todaySales = await redisClient.get(
            `sales:${moment(result.date).format("YYYY-MM-DD")}:${
              result.storeID
            }`
          );

          if (todaySales == null) {
            await redisClient.set(
              `sales:${moment(result.date).format("YYYY-MM-DD")}:${
                result.storeID
              }`,
              value,
              {
                EX: 30 * 24 * 60 * 60,
              }
            );
          } else {
            await redisClient.set(
              `sales:${moment(result.date).format("YYYY-MM-DD")}:${
                result.storeID
              }`,
              Number(todaySales) + value,
              {
                EX: 30 * 24 * 60 * 60,
              }
            );
          }

          result.bills.forEach(async (x: any) => {
            const item: StockOutInterface = {
              date: result.date,
              itemID: x.itemID,
              quantity: x.quantity,
              adjustmentEventID: null,
              storeID: result.storeID,
              billID: result._id.toString(),
              invoiceID: null,
            };
            await queue.add("insertStockOut", item);
          });
        }
      }
    });
  }

  static insertStockIn(data: StockInInterface) {
    Promise.all([
      new StockInModelModel({
        date: data.date,
        itemID: data.itemID,
        quantity: data.quantity,
        residue: data.quantity,
        price: data.price,
        goodReceiptID: data.goodReceiptID,
        adjustmentEventID: data.adjustmentEventID,
        storeID: data.storeID,
      }).create(),
      new StockModelModel({
        itemID: data.itemID,
        storeID: data.storeID,
        quantity: data.quantity,
      }).update(),
      new StockCardModelModel({
        itemID: data.itemID,
        quantity: data.quantity,
        date: data.date,
        billID: null,
        invoiceID: null,
        adjustmentEventID: data.adjustmentEventID,
        goodReceiptID: data.goodReceiptID,
      }),
    ])
      .then(([result, _, __]) => {
        return result._id;
      })
      .catch((error) => {
        throw Error(error);
      });
  }

  static async insertStockOut(data: StockOutInterface) {
    let quantity = data.quantity;
    while (quantity > 0) {
      if (quantity == 0) {
        break;
      }

      const stockIn = await StockInModelModel.fetchFifo(data.itemID);
      if (!stockIn) {
        await new OverflowModelModel({
          itemID: data.itemID,
          quantity: quantity,
          billID: null,
          adjustmentEventID: null,
          invoiceID: null,
        }).create();

        quantity = 0;
        break;
      } else if (stockIn.quantity >= quantity) {
        await Promise.all([
          new StockOutModelModel({
            stockInID: stockIn._id.toString(),
            itemID: data.itemID,
            date: data.date,
            quantity: quantity,
            billID: data.billID,
            adjustmentEventID: data.adjustmentEventID,
            invoiceID: data.invoiceID,
            storeID: data.storeID,
          }).create(),
          StockInModelModel.updateResidue(stockIn._id, quantity),
        ]);

        quantity = 0;
        break;
      } else if (stockIn.quantity < quantity) {
        await Promise.all([
          new StockOutModelModel({
            stockInID: stockIn._id.toString(),
            itemID: data.itemID,
            date: data.date,
            quantity: stockIn.quantity,
            billID: data.billID,
            adjustmentEventID: data.adjustmentEventID,
            invoiceID: data.invoiceID,
            storeID: data.storeID,
          }).create(),
          StockInModelModel.updateResidue(stockIn._id, stockIn.quantity),
        ]);

        quantity = quantity - stockIn.quantity;
      }
    }

    await new StockCardModelModel({
      itemID: data.itemID,
      quantity: data.quantity,
      date: data.date,
      billID: data.billID,
      invoiceID: data.invoiceID,
      adjustmentEventID: data.adjustmentEventID,
      goodReceiptID: null,
    }).create();

    await new StockModelModel({
      itemID: data.itemID,
      quantity: Math.abs(data.quantity) * -1,
      storeID: data.storeID,
    }).update();
  }

  static insertStockOutCardOnly(data: any) {}
}

export default WorkerController;
