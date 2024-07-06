import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import { LoggerType } from "../interfaces/logger.interface";
import DeliverySlipModelModel from "../models/delivery-slip.model";
import StockModelModel from "../models/stock.model";
import LoggerHelper from "../utils/logger.utils";
import { queue } from "../utils/queue.utils";

class DeliverySlipController {
  static create = (req: Request, res: Response) => {
    const date = req.body.date;
    const items = req.body.items as any[];
    const customerID = req.body.customerID;
    const salesID = req.body.salesID;
    const userID = req.body.userID;
    const note = req.body.note;

    const modifiedItems = DeliverySlipModelModel.preCreate(items);
    StockModelModel.checkStockByItemIDs(
      modifiedItems.map((x) => {
        return {
          itemID: x.itemID,
          quantity: x.quantity,
        };
      }),
      null
    )
      .then(async (stock) => {
        let validation = true;
        for (let i = 0; i < modifiedItems.length; i++) {
          const x = modifiedItems[i];
          const stockIndex = stock.findIndex(
            (y) => y.itemID.toString() == x.itemID
          );
          if (stockIndex < 0 || stock[stockIndex].quantity < x.quantity) {
            validation = false;
          }
        }

        if (!validation) {
          return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
        } else {
          const name = await DeliverySlipModelModel.generateName(
            new Date(date)
          );
          new DeliverySlipModelModel({
            name: name,
            date: date,
            customerID: customerID,
            salesID: salesID,
            items: modifiedItems,
            createdBy: userID,
            note: note,
          })
            .create()
            .then(async (result) => {
              result.items.forEach(async (x: any) => {
                await queue.add("insertStockOutTemp", {
                  itemID: x.itemID,
                  quantity: x.quantity,
                  deliverySlipID: result._id,
                });
              });
              res.status(201).send(result);
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on creating delivery slip ${error}`,
                tag: "Delivery slip",
                type: LoggerType.error,
              });
              res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching stock ${error}`,
          tag: "Delivery slip",
          type: LoggerType.error,
        });
      });
  };
}

export default DeliverySlipController;
