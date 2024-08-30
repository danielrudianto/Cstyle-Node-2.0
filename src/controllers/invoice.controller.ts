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
    const paymentStatus = req.body.paymentStatus as string[];
    const keyword = req.body.keyword;

    InvoiceModelModel.fetch({
      page: page,
      keyword: keyword,
      month: month + 1,
      year: year,
      status: status,
      paymentStatus: paymentStatus,
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

  static updatePayment = (req: Request, res: Response) => {
    const id = req.body.id;
    const paidAt = req.body.paidAt;
    const method = req.body.paymentMethod;
    const amount = req.body.amount;
    const userID = req.body.userID;

    InvoiceModelModel.fetchByID(id)
      .then((result) => {
        if (!result || result.isDelete) {
          return res.status(404).send(ErrorList["SALES_INVOICE_NOT_FOUND"]);
        } else if (result.isPaid) {
          return res.status(400).send(ErrorList["SALES_INVOICE_PAID"]);
        } else {
          InvoiceModelModel.updatePayment({
            id: id,
            paidAt: paidAt,
            paymentMethod: method,
            amount: amount,
            paidBy: userID,
          })
            .then(() => {
              return res.status(200).send({
                paidAt: paidAt,
                paymentMethod: method,
                amount: amount,
                paidBy: userID,
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
                async (done) => {
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

                  await PackingListModelModel.deleteByID(
                    result.packingListID._id,
                    userID
                  );
                  done();

                  return res.status(201).send(result);
                }
              );
            } else {
              await lock.acquire(
                result.deliverySlipID.items.map((x: any) => {
                  return `x.itemID:`;
                }),
                async (done) => {
                  result.packingListID.items.forEach(async (x: any) => {
                    await new StockModelModel({
                      itemID: x.itemID,
                      quantity: x.quantity - x.returned,
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

                  await DeliverySlipModelModel.deleteByID(
                    result.deliverySlipID._id,
                    userID
                  );

                  done();

                  return res.status(201).send(result);
                }
              );
            }
          })
          .catch((error) => {});
      }
    });
  };

  static deletePaymentByID = (req: Request, res: Response) => {
    const id = req.params.id;
    InvoiceModelModel.deletePaymentByID(id)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on deleting payment ${error}`,
          tag: "Sales invoice",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default InvoiceController;
