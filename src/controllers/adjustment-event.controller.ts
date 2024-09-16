import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import AdjustmentModelModel from "../models/adjustment.model";
import { queue } from "../utils/queue.utils";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import moment from "moment";
import { StockInInterface } from "../interfaces/stock-in.interface";
import StockModelModel from "../models/stock.model";
import { StockOutInterface } from "../interfaces/stock-out.interface";
import lock from "../utils/lock.utils";

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
          items.map((x) => {
            return `${x.id}:${store == null ? "" : store}`;
          }),
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
                      quantity: Math.abs(x.quantity),
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

  static deleteByID = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;

    AdjustmentModelModel.fetchByID(id)
      .then(async (adjustmentEvent) => {
        if (!adjustmentEvent || adjustmentEvent.isDelete) {
          return res.status(404).send(ErrorList["ADJUSTMENT_EVENT_NOT_FOUND"]);
        }

        await lock.acquire(
          adjustmentEvent.items
            .filter((x: any) => x.quantity > 0)
            .map((x: any) => {
              return `${x.itemID._id.toString()}:${
                adjustmentEvent.storeID == null
                  ? ""
                  : adjustmentEvent.storeID._id.toString()
              }`;
            }),
          (done) => {
            StockModelModel.checkStockByItemIDs(
              adjustmentEvent.items
                .filter((x: any) => x.quantity > 0)
                .map((x: any) => {
                  return {
                    itemID: x.itemID._id,
                    quantity: x.quantity,
                  };
                }),
              adjustmentEvent.storeID == null
                ? null
                : adjustmentEvent.storeID._id
            )
              .then(async (stocks) => {
                let validation = true;
                adjustmentEvent.items
                  .filter((x: any) => x.quantity > 0)
                  .forEach((x: any) => {
                    const stockIndex = stocks.findIndex(
                      (y: any) => y.itemID.toString() == x.itemID._id.toString()
                    );

                    if (stockIndex == -1) {
                      validation = false;
                    } else {
                      const stock = stocks[stockIndex].quantity;
                      if (stock < x.quantity) {
                        validation = false;
                      }
                    }
                  });

                if (!validation) {
                  done();
                  return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
                } else {
                  AdjustmentModelModel.deleteByID(id, userID).then(
                    async (result) => {
                      result.items.forEach(async (x: any) => {
                        await new StockModelModel({
                          itemID: x.itemID._id,
                          storeID:
                            adjustmentEvent.storeID == null
                              ? null
                              : adjustmentEvent.storeID._id,
                          quantity: x.quantity * -1,
                        }).update();
                      });

                      await queue.add("deleteAdjustment", {
                        id: id,
                      });

                      done();
                      return res.status(200).send(result);
                    }
                  );
                }
              })
              .catch((error) => {
                new LoggerHelper({
                  message: `Error on checking stock for adjustment event: ${error}`,
                  tag: "Adjustment",
                  type: LoggerType.error,
                }).log();

                done();
                return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
              });
          }
        );
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
}

export default AdjustmentEventController;
