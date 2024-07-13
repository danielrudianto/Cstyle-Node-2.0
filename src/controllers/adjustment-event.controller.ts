import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import AdjustmentModelModel from "../models/adjustment.model";
import { queue } from "../utils/queue.utils";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import moment from "moment";
import AsyncLock from "async-lock";
import { StockInInterface } from "../interfaces/stock-in.interface";
import StockModelModel from "../models/stock.model";
import { StockOutInterface } from "../interfaces/stock-out.interface";

const lock = new AsyncLock();

class AdjustmentEventController {
  static create = async (req: Request, res: Response) => {
    const date = req.body.date;
    const items = req.body.items as any[];
    const userID = req.body.userID;
    const store = req.body.store;

    if (items.filter((x) => x.quantity == 0).length > 0) {
      return res.status(400).send(ErrorList["BAD_REQUEST"]);
    } else {
      const negativeItems = items.filter((x) => x.quantity < 0);
      lock
        .acquire(
          items.map((x) => x.id),
          async () => {
            const validation = await AdjustmentModelModel.preCreate(
              negativeItems,
              store
            );

            if (!validation) {
              return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
            } else {
              try {
                const name = await AdjustmentModelModel.generateName(
                  new Date(date)
                );

                const result = await new AdjustmentModelModel({
                  date: new Date(date),
                  name: name,
                  storeID: store,
                  items: items.map((x) => {
                    return {
                      itemID: x.id,
                      quantity: x.quantity,
                    };
                  }),
                  createdBy: userID,
                }).create();

                items.forEach(async (x: any) => {
                  await new StockModelModel({
                    itemID: x.id,
                    quantity: x.quantity,
                    storeID: store,
                  }).update();

                  if (x.quantity < 0) {
                    const stockOutData: StockOutInterface = {
                      itemID: x.id,
                      quantity: x.quantity,
                      adjustmentEventID: result._id,
                      storeID: store,
                      date: date,
                      billID: null,
                      invoiceID: null,
                    };

                    await queue.add("insertStockOut", stockOutData);
                  } else if (x.quantity > 0) {
                    const stockInData: StockInInterface = {
                      itemID: x.id,
                      quantity: x.quantity,
                      residue: x.quantity,
                      price: 0,
                      adjustmentEventID: result._id,
                      goodReceiptID: null,
                      storeID: store,
                      date: date,
                    };

                    await queue.add("insertStockIn", stockInData);
                  }
                });

                return result;
              } catch (error) {
                new LoggerHelper({
                  message: `Error on creating adjustment event: ${error}`,
                  type: LoggerType.error,
                  tag: "Adjustment",
                }).log();

                return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
              }
            }
          }
        )
        .then((value) => {
          return res.status(201).send(value);
        })
        .catch((error) => {
          new LoggerHelper({
            message: `Error on creating adjustment event: ${error}`,
            type: LoggerType.error,
            tag: "Adjustment",
          }).log();
          return res.status(500).send(error);
        });
    }
  };

  static fetch = (req: Request, res: Response) => {
    const page = req.body.page;
    const month = req.body.month;
    const year = req.body.year;
    const keyword = req.body.keyword;
    const status = req.body.status as string[];

    AdjustmentModelModel.fetch({
      page: page,
      month: month + 1,
      year: year,
      keyword: keyword,
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
          message: `Error on fetching adjustment event: ${error}`,
          type: LoggerType.error,
          tag: "Adjustment",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    AdjustmentModelModel.fetchByID(id)
      .then((result) => {
        if (!result) {
          return res.status(404).send(ErrorList["ADJUSTMENT_EVENT_NOT_FOUND"]);
        } else {
          return res.status(200).send(result);
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching adjustment event: ${error}`,
          tag: "Adjustment",
          type: LoggerType.error,
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default AdjustmentEventController;
