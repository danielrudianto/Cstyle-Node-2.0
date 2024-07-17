import { Request, Response } from "express";
import InvoiceModelModel from "../models/invoice.model";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { ErrorList } from "../data/error-list";
import PackingListModelModel from "../models/packing-list.model";
import DeliverySlipModelModel from "../models/delivery-slip.model";
import lock from "../utils/lock.utils";
import StockModelModel from "../models/stock.model";
import { queue } from "../utils/queue.utils";
import {
  RemoveStockOutInterface,
  StockOutInterface,
} from "../interfaces/stock-out.interface";

class InvoiceController {
  static fetch = (req: Request, res: Response) => {
    const page = req.body.page;
    const month = req.body.month;
    const year = req.body.year;
    const status = req.body.status as string[];
    const keyword = req.body.keyword;

    InvoiceModelModel.fetch({
      page: page,
      keyword: keyword,
      month: month + 1,
      year: year,
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
          message: `Error on fetching sales invoice ${error}`,
          tag: "Sales invoice",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    InvoiceModelModel.fetchByID(id)
      .then(async (result) => {
        if (!result) {
          return res.status(404).send(ErrorList["SALES_INVOICE_NOT_FOUND"]);
        } else {
          if (result.packingListID) {
            const packingList = await PackingListModelModel.fetchByID(
              result.packingListID._id
            );

            result.packingListID = packingList;
            return res.status(200).send(result);
          } else {
            const deliverySlip = await DeliverySlipModelModel.fetchByID(
              result.deliverySlipID._id
            );

            result.deliverySlipID = deliverySlip;
            return res.status(200).send(result);
          }
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching sales invoice ${error}`,
          tag: "Sales invoice",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static deleteByID = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;
    InvoiceModelModel.fetchByID(id).then((result) => {
      if (!result || result.isDelete) {
        return res.status(404).send(ErrorList["SALES_INVOICE_NOT_FOUND"]);
      } else {
        InvoiceModelModel.deleteByID(id, userID)
          .then(async () => {
            if (result.packingListID) {
              await lock.acquire(
                result.packingListID.items.map((x: any) => {
                  return `x.itemID:`;
                }),
                (done) => {
                  result.packingListID.items.forEach(async (x: any) => {
                    await new StockModelModel({
                      itemID: x.itemID,
                      quantity: x.quantity,
                      storeID: null,
                    }).update();

                    const stockOutData: RemoveStockOutInterface = {
                      itemID: x.itemID,
                      adjustmentCaseID: null,
                      quantity: x.quantity,
                      billID: null,
                      invoiceID: id,
                      storeID: null,
                    };

                    await queue.add("removeStockOut", stockOutData);
                  });
                  done();

                  return res.status(201).send(result);
                }
              );
            } else {
            }
          })
          .catch((error) => {});
      }
    });
  };
}

export default InvoiceController;
