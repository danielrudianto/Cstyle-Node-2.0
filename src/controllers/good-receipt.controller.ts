import { Request, Response } from "express";
import {
  GoodReceiptCreateModel,
  GoodReceiptModelModel,
} from "../models/good-receipt.model";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { ErrorList } from "../data/error-list";
import { queue } from "../utils/queue.utils";
import { GoodReceiptStatus } from "../interfaces/good-receipt.interface";
import StockModelModel from "../models/stock.model";
import { StockInInterface } from "src/interfaces/stock-in.interface";
import { RemoveStockInInterface } from "src/interfaces/stock-out.interface";
import AsyncLock from "async-lock";
import StockInModelModel from "../models/stock-in.model";

const lock = new AsyncLock({
  maxPending: 1,
});

class GoodReceiptController {
  static create = (req: Request, res: Response) => {
    const name = req.body.name;
    const date = req.body.date;
    const supplier = req.body.supplier;
    const items = req.body.items as any[];
    const userID = req.body.userID;

    new GoodReceiptCreateModel({
      name: name,
      date: new Date(date),
      supplierID: supplier,
      createdBy: userID,
      items: items.map((x) => {
        return {
          itemID: x.id,
          quantity: x.quantity,
          price: x.price,
          discount: (x.price * x.discount) / 100,
        };
      }),
    })
      .create()
      .then((result) => {
        items.forEach(async (x) => {
          await lock.acquire(x.id, async () => {
            await new StockModelModel({
              itemID: x.id,
              quantity: x.quantity,
              storeID: null,
            }).update();
          });

          const stockInData: StockInInterface = {
            itemID: x.id,
            quantity: x.quantity,
            residue: x.quantity,
            price: (x.price * (100 - x.discount)) / 100,
            adjustmentEventID: null,
            goodReceiptID: result._id,
            storeID: null,
            date: date,
          };

          await queue.add("insertStockIn", stockInData);
        });

        return res.status(201).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on creating good receipt ${error}`,
          tag: "GoodReceipt",
          type: LoggerType.error,
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetch = (req: Request, res: Response) => {
    const keyword = req.body.keyword;
    const month = req.body.month + 1;
    const year = req.body.year;
    const page = req.body.page;
    const status = req.body.status as GoodReceiptStatus[];

    GoodReceiptModelModel.fetch({
      keyword: keyword,
      month: month,
      year: year,
      page: page,
      status: status,
    })
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching good receipt ${error}`,
          tag: "GoodReceipt",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    GoodReceiptModelModel.fetchByID(id)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching good receipt ${error}`,
          tag: "Good receipt",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static updateByID = (req: Request, res: Response) => {
    const id = req.body.id;
    const name = req.body.name;
    const supplierID = req.body.supplier;
    const newItems = req.body.items;
    const date = req.body.date;
    const userID = req.body.userID;

    GoodReceiptModelModel.fetchByID(id).then(async (result) => {
      if (!result || result.isDelete) {
        return res.status(404).send(ErrorList["GOOD_RECEIPT_ALREADY_DELETED"]);
      }

      // Check if stock is deleted and added the new one, is it still sufficient?
      const items = result.items;
      const stocks = await StockModelModel.checkStockByItemIDs(
        items.map((x: any) => {
          return {
            id: x.itemID,
          };
        }),
        null
      );

      let validation = true;

      for (let i = 0; i < items.length; i++) {
        const stockIndex = stocks.findIndex(
          (x: any) => x.id.toString() == items[i].itemID.toString()
        );

        if (stockIndex == -1) {
          validation = false;
        } else {
          const newIndex = newItems.findIndex(
            (x: any) => x.id == items[i].itemID
          );

          if (newIndex != -1) {
            if (
              stocks[stockIndex].quantity <
              req.body.items[newIndex].quantity - items[i].quantity
            ) {
              validation = false;
            }
          } else {
            if (stocks[stockIndex].quantity < items[i].quantity) {
              validation = false;
            }
          }
        }
      }

      if (!validation) {
        return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
      } else {
        new GoodReceiptCreateModel({
          id: id,
          name: name,
          supplierID: supplierID,
          date: date,
          items: newItems.map((x: any) => {
            return {
              itemID: x.id,
              quantity: x.quantity,
              price: x.price,
              discount: (x.price * x.discount) / 100,
            };
          }),
          createdBy: userID,
        })
          .update()
          .then(async (goodReceipt) => {
            for (let i = 0; i < result.items.length; i++) {
              const data: RemoveStockInInterface = {
                itemID: result.items[i].itemID,
                quantity: result.items[i].quantity,
                goodReceiptID: id,
                adjustmentCaseID: null,
                storeID: null,
              };
              await queue.add("removeStockIn", data);
            }

            for (let i = 0; i < newItems.length; i++) {
              const data: StockInInterface = {
                goodReceiptID: id,
                itemID: newItems[i].id,
                quantity: newItems[i].quantity,
                price: (newItems[i].price * (100 - newItems[i].discount)) / 100,
                residue: newItems[i].quantity,
                adjustmentEventID: null,
                storeID: null,
                date: new Date(date),
              };
              await queue.add("insertStockIn", data);
            }

            await queue.add("checkOverflow", {});

            return res.status(201).send(goodReceipt);
          })
          .catch((error) => {
            new LoggerHelper({
              message: `Error on updating good receipt document ${error}`,
              tag: "Good receipt",
              type: LoggerType.error,
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      }
    });
  };
}
export default GoodReceiptController;
