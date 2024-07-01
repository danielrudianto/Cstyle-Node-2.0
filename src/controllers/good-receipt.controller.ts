import { Request, Response } from "express";
import GoodReceiptCreateModel from "../models/good-receipt.model";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { ErrorList } from "../data/error-list";
import { queue } from "../utils/queue.utils";
import { GoodReceiptStatus } from "../interfaces/good-receipt.interface";

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
          await queue.add("insertStockIn", {
            itemID: x.id,
            goodReceiptID: result.id,
            adjustmentCaseID: null,
            quantity: x.quantity,
            price: (x.price * (100 - x.discount)) / 100,
            residue: x.quantity,
          });
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

    GoodReceiptCreateModel.fetch({
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
}
export default GoodReceiptController;
