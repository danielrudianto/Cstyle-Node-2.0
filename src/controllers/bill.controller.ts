import { Request, Response } from "express";
import { redisClient } from "../app";
import BillModelModel from "../models/bill.model";
import { ErrorList } from "../data/error-list";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";

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
}

export default BillController;
