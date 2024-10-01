import { Request, Response } from "express";
import { redisClient } from "../app";
import BillModelModel from "../models/bill.model";
import { ErrorList } from "../data/error-list";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import lock from "../utils/lock.utils";
import StockModelModel from "../models/stock.model";
import { queue } from "../utils/queue.utils";

class BillController {
  static fetch = (req: Request, res: Response) => {
    const userID = req.body.userID;
    const page = req.body.page;
    const keyword = req.body.keyword;
    const month = req.body.month;
    const year = req.body.year;
    const storeID = req.body.storeID as string[];

    redisClient
      .get(`users:${userID}`)
      .then((data) => {
        const user = JSON.parse(data!);
        const role = user.accessLevel;

        BillModelModel.fetch({
          month: month,
          year: year,
          page: page,
          keyword: keyword,
          storeID: storeID,
          isOwner: role == 1,
        })
          .then(([result, count]) => {
            return res.status(200).send({
              data: result,
              count: count,
            });
          })
          .catch((error) => {
            new LoggerHelper({
              message: `Error on fetching bills ${error}`,
              type: LoggerType.error,
              tag: "Bill",
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user on bill ${error}`,
          type: LoggerType.error,
          tag: "Bill",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;

    BillModelModel.fetchByID(id)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching bill by ID ${error}`,
          type: LoggerType.error,
          tag: "Bill",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static deleteByID = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;

    BillModelModel.fetchByID(id)
      .then((bill) => {
        if (!bill) {
          return res.status(404).send(ErrorList["BILL_NOT_FOUND"]);
        }

        if (bill.isDelete) {
          return res.status(400).send(ErrorList["BILL_DELETED"]);
        }

        BillModelModel.deleteByID({
          id: id,
          userID: userID,
        })
          .then(async () => {
            await lock.acquire(
              bill.items.map((item: any) => {
                return `${item.itemID}:${bill.storeID}`;
              }),
              (done) => {
                bill.items.forEach(async (x: any) => {
                  await new StockModelModel({
                    itemID: x.itemID._id,
                    quantity: x.quantity,
                    storeID: bill.storeID,
                  }).update();

                  await queue.add("removeStockOut", {
                    itemID: x.itemID._id.toString(),
                    adjustmentCaseID: null,
                    quantity: x.quantity,
                    storeID: bill.storeID,
                    billID: id,
                    invoiceID: null,
                  });
                });

                done();

                return res.status(200).send(bill);
              }
            );
          })
          .catch((error) => {
            new LoggerHelper({
              message: `Error on deleting bill ${error}`,
              type: LoggerType.error,
              tag: "Bill",
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching bill by ID ${error}`,
          type: LoggerType.error,
          tag: "Bill",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default BillController;
