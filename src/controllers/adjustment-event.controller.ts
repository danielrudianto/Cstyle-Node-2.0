import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import AdjustmentModelModel from "../models/adjustment.model";
import { queue } from "../utils/queue.utils";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import moment from "moment";

class AdjustmentEventController {
  static create = (req: Request, res: Response) => {
    const date = req.body.date;
    const items = req.body.items as any[];
    const userID = req.body.userID;
    const store = req.body.store;

    if (items.filter((x) => x.quantity == 0).length > 0) {
      return res.status(400).send(ErrorList["BAD_REQUEST"]);
    } else {
      const negativeItems = items.filter((x) => x.quantity < 0);
      AdjustmentModelModel.preCreate(negativeItems, store)
        .then(async (validation) => {
          if (!validation) {
            return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
          } else {
            const name = await AdjustmentModelModel.generateName(
              new Date(date)
            );
            new AdjustmentModelModel({
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
            })
              .create()
              .then((result) => {
                // If it succeed, now it's time to input the stockIn directories
                result.items
                  .filter((x: any) => x.quantity > 0)
                  .forEach(async (x: any) => {
                    await queue.add("insertStockIn", {
                      itemID: x.itemID,
                      quantity: x.quantity,
                      residue: x.quantity,
                      price: 0,
                      adjustmentEventID: result._id,
                      goodReceiptID: null,
                      storeID: store,
                    });
                  });

                result.items
                  .filter((x: any) => x.quantity < 0)
                  .forEach(async (x: any) => {
                    await queue.add("insertStockOut", {
                      itemID: x.itemID,
                      quantity: x.quantity * -1,
                      adjustmentEventID: result._id,
                      billID: null,
                      storeID: null,
                      date: moment(new Date(date)).format("YYYY-MM-DD"),
                    });
                  });

                return res.status(201).send(result);
              })
              .catch((error) => {
                new LoggerHelper({
                  message: `Error on creating adjustment event: ${error}`,
                  type: LoggerType.error,
                  tag: "Adjustment",
                }).log();

                return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
              });
          }
        })
        .catch((error) => {
          new LoggerHelper({
            message: `Error on pre-creating adjustment event: ${error}`,
            type: LoggerType.error,
            tag: "Adjustment",
          }).log();

          return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
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
