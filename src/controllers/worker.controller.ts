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
import StockInModelModel from "../models/stock-in.model";
import StockModelModel from "../models/stock.model";
import StockCardModelModel from "../models/stock-card.model";
import OverflowModelModel from "../models/overflow.model";
import {
  RemoveStockInInterface,
  RemoveStockOutInterface,
  StockOutInterface,
  StockOutTempInterface,
  StockOutTransferInterface,
} from "../interfaces/stock-out.interface";
import StockOutModelModel from "../models/stock-out.model";
import {
  UpdateProductImageDataInterface,
  CommonWorkerInterface,
} from "../interfaces/worker.interface";
import AdjustmentModelModel from "../models/adjustment.model";
import { DeleteStockInInterface } from "../interfaces/stock.interface";

class WorkerController {
  static createProduct(data: CommonWorkerInterface): void {
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

  static updateProduct(data: CommonWorkerInterface): any {
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

  static updateProductImages(data: UpdateProductImageDataInterface): any {
    const id = data.id;
    const images = data.images as string[];

    MigrationModelModel.updateProductImages({
      id,
      images: images,
    });
  }

  static async deleteProduct(data: CommonWorkerInterface): Promise<any> {
    const id = data.id;
    ItemModelModel.fetchByID(id).then(async (item) => {
      if (!item) {
        throw Error(ErrorList["ITEM_NOT_FOUND"]);
      }

      await MigrationModelModel.deleteProduct(id);
      item.images.forEach(async (x: string) => {
        await MigrationModelModel.deleteProductImage(x, id);
      });
    });
  }

  static createUser(data: CommonWorkerInterface) {
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

  static updateUser(data: CommonWorkerInterface) {
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

  static deleteUser(data: CommonWorkerInterface) {
    MigrationModelModel.deleteUser(data.id)
      .then((result) => {
        return result;
      })
      .catch((error) => {
        throw Error(error);
      });
  }

  static async createBill(data: CommonWorkerInterface) {
    const result = await BillModelModel.fetchByID(data.id);
    if (!result) {
      throw Error(ErrorList["BILL_NOT_FOUND"]);
    } else {
      const value = result.items.reduce((acc: number, item: any) => {
        return acc + (item.price - item.discount) * item.quantity;
      }, 0);

      if (result.memberID != null) {
        const conversion = await redisClient.get("conversion");
        const point =
          Number(conversion) == 0 ? 0 : Math.floor(value / Number(conversion));

        await MembershipModelModel.updatePoint(result.memberID, point);
      }

      result.items.forEach(async (x: any) => {
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

  static async deleteAdjustment(data: CommonWorkerInterface) {
    const adjustmentEvent = await AdjustmentModelModel.fetchByID(data.id);
    if (!adjustmentEvent || !adjustmentEvent.isDelete) {
      throw Error(ErrorList["ADJUSTMENT_EVENT_NOT_FOUND"]);
    }

    adjustmentEvent.items.forEach(async (x: any) => {
      if (x.quantity > 0) {
        const removeStockInData: RemoveStockInInterface = {
          itemID: x.itemID._id,
          quantity: x.quantity,
          storeID:
            adjustmentEvent.storeID == null
              ? null
              : adjustmentEvent.storeID._id,
          goodReceiptID: null,
          adjustmentCaseID: data.id,
        };

        await queue.add("removeStockIn", removeStockInData);
      } else if (x.quantity < 0) {
        const removeStockOutData: RemoveStockOutInterface = {
          itemID: x.itemID,
          quantity: x.quantity,
          storeID:
            adjustmentEvent.storeID == null
              ? null
              : adjustmentEvent.storeID._id,
          billID: null,
          invoiceID: null,
          adjustmentCaseID: data.id,
        };

        await queue.add("removeStockOut", removeStockOutData);
      }

      await queue.add("checkOverflow", {});
    });
  }

  static async insertStockIn(data: StockInInterface) {
    const [result, _] = await Promise.all([
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
      new StockCardModelModel({
        itemID: data.itemID,
        quantity: data.quantity,
        date: data.date,
        billID: null,
        invoiceID: null,
        adjustmentEventID: data.adjustmentEventID,
        goodReceiptID: data.goodReceiptID,
        deliverySlipID: null,
      }),
    ]);

    return result._id;
  }

  static async removeStockIn(data: RemoveStockInInterface) {
    // MOVE THE STOCK OUTS WITH CORRESPONDING STOCK IN TO OVERFLOW
    const result = await StockInModelModel.fetchDeletation(data);
    const stockOuts = await StockOutModelModel.fetchByStockInID(result._id);

    if (stockOuts.length > 0) {
      await Promise.all(
        stockOuts.map(async (x) => {
          await new OverflowModelModel({
            itemID: data.itemID,
            quantity: x.quantity,
            billID: x.billID,
            adjustmentEventID: x.adjustmentEventID,
            invoiceID: x.invoiceID,
          }).create();
        })
      );
    }

    // Delete the stock in
    const deleteStockIn: DeleteStockInInterface = {
      itemID: data.itemID,
      adjustmentEventID: data.adjustmentCaseID,
      goodReceiptID: data.goodReceiptID,
    };
    await StockInModelModel.delete(deleteStockIn);
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
          billID: data.billID,
          adjustmentEventID: data.adjustmentEventID,
          invoiceID: data.invoiceID,
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
      deliverySlipID: null,
    }).create();
  }

  static async removeStockOut(data: RemoveStockOutInterface) {
    StockOutModelModel.fetchDeletation(data).then((result) => {
      result.forEach((x) => {
        const stockInID = x.stockInID;
        StockInModelModel.updateResidue(stockInID, x.quantity);
      });
    });
  }

  static async insertStockOutOnly(data: StockOutInterface) {
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
          billID: data.billID,
          adjustmentEventID: data.adjustmentEventID,
          invoiceID: data.invoiceID,
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
  }

  static async insertStockOutCardOnly(data: StockOutTempInterface) {
    await new StockCardModelModel({
      itemID: data.itemID,
      quantity: Math.abs(data.quantity) * -1,
      date: data.date,
      billID: null,
      invoiceID: null,
      adjustmentEventID: null,
      goodReceiptID: null,
      deliverySlipID: data.deliverySlipID,
    }).create();

    await new StockModelModel({
      itemID: data.itemID,
      quantity: Math.abs(data.quantity) * -1,
      storeID: null,
    }).update();
  }

  static async removeStockOutCardOnly(data: StockOutTempInterface) {
    await StockCardModelModel.deleteByDeliverySlipID(data.deliverySlipID);

    await new StockModelModel({
      itemID: data.itemID,
      quantity: Math.abs(data.quantity),
      storeID: null,
    }).update();
  }

  static async stockOutTransfer(data: StockOutTransferInterface) {
    try {
      await new StockModelModel({
        itemID: data.itemID,
        quantity: Math.abs(data.quantity) * -1,
        storeID: data.storeID,
      }).update();

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async stockInTransfer(data: StockOutTransferInterface) {
    try {
      await new StockModelModel({
        itemID: data.itemID,
        quantity: Math.abs(data.quantity),
        storeID: data.storeID,
      }).update();

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async checkOverflow() {
    const overflows = await OverflowModelModel.fetchAll();
    for (let i = 0; i < overflows.length; i++) {
      const data: StockOutInterface = {
        quantity: overflows[i].quantity,
        itemID: overflows[i].itemID,
        billID: overflows[i].billID,
        invoiceID: overflows[i].invoiceID,
        adjustmentEventID: overflows[i].adjustmentEventID,
        storeID: null,
        date: new Date(),
      };
      queue.add("insertStockOutOnly", data);
    }
  }
}

export default WorkerController;
