import { Request, Response } from "express";
import PackingListModelModel from "../models/packing-list.model";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { ErrorList } from "../data/error-list";
import StockModelModel from "../models/stock.model";
import { queue } from "../utils/queue.utils";
import { StockOutInterface } from "../interfaces/stock-out.interface";
import InvoiceModelModel from "../models/invoice.model";

class PackingListController {
  static create = async (req: Request, res: Response) => {
    const date = req.body.date;
    const dueDate = req.body.dueDate;
    const note = req.body.note;
    const invoiceNote = req.body.invoiceNote;
    const items = req.body.items as any[];
    const customerID = req.body.customerID;
    const salesID = req.body.salesID;
    const userID = req.body.userID;

    const modifiedItems = PackingListModelModel.preCreate(items);
    StockModelModel.checkStockByItemIDs(
      modifiedItems.map((x) => {
        return {
          itemID: x.itemID,
          quantity: x.quantity,
        };
      }),
      null
    ).then(async (stock) => {
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
        const name = await PackingListModelModel.generateName(new Date(date));
        new PackingListModelModel({
          name: name,
          date: date,
          note: note,
          items: modifiedItems,
          salesID: salesID,
          customerID: customerID,
          createdBy: userID,
        })
          .create()
          .then(async (result) => {
            const invoiceName = await InvoiceModelModel.generateName(
              new Date(date)
            );
            // Now input the sales invoice
            new InvoiceModelModel({
              name: invoiceName,
              date: date,
              dueDate: dueDate,
              note: invoiceNote,
              packingListID: result._id,
              deliverySlipID: null,
              createdBy: userID,
              customerID: customerID,
              salesID: salesID,
            })
              .create()
              .then(() => {
                result.items
                  .filter((x: any) => x.quantity > 0)
                  .forEach(async (x: any) => {
                    await queue.add("insertStockOut", {
                      itemID: x.itemID,
                      quantity: x.quantity,
                      residue: x.quantity,
                      price: 0,
                      packingListID: result._id,
                      goodReceiptID: null,
                      storeID: null,
                    });
                  });

                return res.status(201).send(result);
              })
              .catch((error) => {
                new LoggerHelper({
                  message: `Error on creating invoice ${error}`,
                  type: LoggerType.error,
                  tag: "Invoice",
                }).log();
                return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
              });
          })
          .catch((error) => {
            new LoggerHelper({
              message: `Error on creating packing list ${error}`,
              type: LoggerType.error,
              tag: "Packing list",
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      }
    });
  };

  static fetch = (req: Request, res: Response) => {
    const keyword = req.body.keyword;
    const month = req.body.month + 1;
    const year = req.body.year;
    const page = req.body.page;
    const status = req.body.status as string[];

    PackingListModelModel.fetch({
      keyword: keyword,
      month: month,
      year: year,
      status: status,
      page: page,
    }).then(([result, count]) => {
      return res.status(200).send({
        data: result,
        count: count,
      });
    });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    Promise.all([
      PackingListModelModel.fetchByID(id),
      InvoiceModelModel.fetchByPackingListID(id),
    ])
      .then(([packingList, salesInvoice]) => {
        if (!packingList || !salesInvoice) {
          return res.status(404).send(ErrorList["PACKING_LIST_NOT_FOUND"]);
        } else {
          return res.status(200).send({
            packingList: packingList,
            salesInvoice: salesInvoice,
          });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching packing list ${error}`,
          type: LoggerType.error,
          tag: "Packing list",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default PackingListController;
