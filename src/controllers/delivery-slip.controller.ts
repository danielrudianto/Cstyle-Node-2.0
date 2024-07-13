import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import { LoggerType } from "../interfaces/logger.interface";
import DeliverySlipModelModel from "../models/delivery-slip.model";
import StockModelModel from "../models/stock.model";
import LoggerHelper from "../utils/logger.utils";
import { queue } from "../utils/queue.utils";
import InvoiceModelModel from "../models/invoice.model";
import {
  StockOutInterface,
  StockOutTempInterface,
} from "src/interfaces/stock-out.interface";

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
            isDelete: false,
            isReturn: false,
            deletedAt: null,
            deletedBy: null,
            returnedAt: null,
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
              return res.status(201).send(result);
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on creating delivery slip ${error}`,
                tag: "Delivery slip",
                type: LoggerType.error,
              });
              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching stock ${error}`,
          tag: "Delivery slip",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetch = (req: Request, res: Response) => {
    const page = req.body.page;
    const keyword = req.body.keyword;
    const month = req.body.month;
    const year = req.body.year;
    const status = req.body.status;

    DeliverySlipModelModel.fetch({
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
          message: `Error on fetching delivery slip ${error}`,
          tag: "Delivery slip",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;

    DeliverySlipModelModel.fetchByID(id)
      .then((result) => {
        if (!result) {
          return res.status(404).send(ErrorList["DELIVERY_SLIP_NOT_FOUND"]);
        } else {
          return res.status(200).send(result);
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching delivery slip ${error}`,
          tag: "Delivery slip",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByIDWInvoice = (req: Request, res: Response) => {
    const id = req.params.id;
    Promise.all([
      DeliverySlipModelModel.fetchByID(id),
      InvoiceModelModel.fetchByDeliverySlipID(id),
    ])
      .then(([deliverySlip, salesInvoice]) => {
        return res.status(200).send({
          deliverySlip: deliverySlip,
          salesInvoice: salesInvoice,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching delivery slip ${error}`,
          tag: "Delivery slip",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchUnconfirmed = (req: Request, res: Response) => {
    const page = !req.query.page ? 1 : Number(req.query.page);
    DeliverySlipModelModel.fetchUnconfirmed(page)
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching unconfirmed delivery slips ${error}`,
          tag: "Delivery slips",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static confirm = (req: Request, res: Response) => {
    const items = req.body.items;
    const invoiceDueDate = new Date(req.body.invoiceDueDate);
    const invoiceDate = new Date(req.body.invoiceDate);
    const invoiceNote = req.body.invoiceNote;
    const deliverySlipID = req.body.id;

    DeliverySlipModelModel.fetchByID(deliverySlipID).then((result) => {
      if (!result) {
        return res.status(404).send(ErrorList["DELIVERY_SLIP_NOT_FOUND"]);
      }

      if (result.isDelete) {
        return res.status(400).send(ErrorList["DELIVERY_SLIP_DELETED"]);
      }

      if (result.isReturn) {
        return res.status(400).send(ErrorList["DELIVERY_SLIP_RETURNED"]);
      }

      DeliverySlipModelModel.update({
        id: deliverySlipID,
        items: items,
        returnedAt: invoiceDate,
      }).then(async (result) => {
        for (let i = 0; i < result.items.length; i++) {
          // return the stocks
          const data: StockOutTempInterface = {
            date: result.date,
            quantity: result.items[i].quantity,
            itemID: result.items[i].itemID,
            deliverySlipID: deliverySlipID,
          };
          await queue.add("removeStockOutTemp", data);
        }

        const invoiceName = await InvoiceModelModel.generateName(invoiceDate);
        new InvoiceModelModel({
          name: invoiceName,
          date: invoiceDate,
          dueDate: invoiceDueDate,
          note: invoiceNote,
          isDelete: false,
          isHidden: false,
          deliverySlipID: deliverySlipID,
          packingListID: null,
          createdBy: req.body.userID,
          salesID: result.salesID,
          customerID: result.customerID,
        })
          .create()
          .then(async (salesInvoice) => {
            for (let i = 0; i < result.items.length; i++) {
              const data: StockOutInterface = {
                date: invoiceDate,
                quantity: result.items[i].quantity,
                itemID: result.items[i].itemID,
                invoiceID: salesInvoice._id,
                adjustmentEventID: null,
                billID: null,
                storeID: null,
              };

              await queue.add("insertStockOut", data);
            }

            return res.status(201).send(result);
          })
          .catch((error) => {
            new LoggerHelper({
              message: `Error on creating invoice ${error}`,
              tag: "Invoice",
              type: LoggerType.error,
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      });
    });
  };
}

export default DeliverySlipController;
