import { Request, Response } from "express";
import BillModelModel from "../models/bill.model";
import { ErrorList } from "../data/error-list";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import InvoiceModelModel from "../models/invoice.model";
import { redisClient } from "../app";
import StockOutModelModel from "../models/stock-out.model";

class ReportController {
  static fetchSalesReport = (req: Request, res: Response) => {
    const storeID = req.body.store;
    const month = req.body.month;
    const year = req.body.year;
    const userID = req.body.userID;

    redisClient
      .get(`users:${userID}`)
      .then((user) => {
        const data = JSON.parse(user!);
        const accessLevel = data.accessLevel;

        if (accessLevel != 0 && accessLevel != 4) {
          return res.status(400).send(ErrorList["ACCESS_DENIED"]);
        } else {
          Promise.all([
            BillModelModel.fetchReport(storeID, month, year),
            storeID == null
              ? InvoiceModelModel.fetchReport(month, year, accessLevel === 0)
              : Promise.resolve([]),
          ])
            .then(([bills, invoices]) => {
              return res.status(200).send({
                bills: bills.map((x, index) => {
                  const QRISPaymentIndex = x.payment.findIndex(
                    (a: any) => a.type.toLowerCase() === "qris"
                  );

                  const CashPaymentIndex = x.payment.findIndex(
                    (a: any) => a.type.toLowerCase() === "cash"
                  );

                  const PayPalPaymentIndex = x.payment.findIndex(
                    (a: any) => a.type.toLowerCase() === "paypal"
                  );

                  const VoucherPaymentIndex = x.payment.findIndex(
                    (a: any) => a.type.toLowerCase() === "voucher"
                  );

                  const BankTransferPaymentIndex = x.payment.findIndex(
                    (a: any) => a.type.toLowerCase() === "bank transfer"
                  );

                  const CardPaymentIndex = x.payment.findIndex(
                    (a: any) => a.type.toLowerCase() === "card"
                  );

                  const QRISPayment =
                    QRISPaymentIndex !== -1
                      ? x.payment[QRISPaymentIndex].amount
                      : 0;

                  const CashPayment =
                    CashPaymentIndex !== -1
                      ? x.payment[CashPaymentIndex].amount
                      : 0;

                  const PayPalPayment =
                    PayPalPaymentIndex !== -1
                      ? x.payment[PayPalPaymentIndex].amount
                      : 0;

                  const VoucherPayment =
                    VoucherPaymentIndex !== -1
                      ? x.payment[VoucherPaymentIndex].amount
                      : 0;

                  const BankTransferPayment =
                    BankTransferPaymentIndex !== -1
                      ? x.payment[BankTransferPaymentIndex].amount
                      : 0;

                  const CardPayment =
                    CardPaymentIndex !== -1
                      ? x.payment[CardPaymentIndex].amount
                      : 0;

                  return {
                    No: index + 1,
                    ID: x._id,
                    BillNumber: x.name,
                    Date: x.date.toString().split("T")[0],
                    Time: x.createdAt.toString().split("T")[1],
                    Value: x.items.reduce(
                      (acc: any, item: any) =>
                        acc + (item.price - item.discount) * item.quantity,
                      0
                    ),
                    Cash: CashPayment,
                    Card: CardPayment,
                    "Bank Transfer": BankTransferPayment,
                    PayPal: PayPalPayment,
                    QRIS: QRISPayment,
                    Voucher: VoucherPayment,
                    "Created by": x.createdBy.name,
                    Member: x.memberID == null ? "NO" : x.memberID,
                    Remakrs: x.isHidden ? "H" : "",
                  };
                }),
                invoices: invoices.map((x, index) => {
                  return {
                    No: index + 1,
                    ID: x._id,
                    "Invoice number": x.name,
                    Date: x.date.toString().split("T")[0],
                    Time: x.createdAt.toString().split("T")[1],
                    Value: x.packingListID.items.reduce(
                      (acc: any, item: any) =>
                        acc + (item.price - item.discount) * item.quantity,
                      0
                    ),
                    Customer: x.customerID == null ? "?NO" : x.customerID.name,
                    "Created by": x.createdBy.name,
                    Remarks: x.isHidden ? "H" : "",
                  };
                }),
              });
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on fetching sales report data ${error}`,
                type: LoggerType.error,
                tag: "Sales report",
              }).log();

              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user data ${error}`,
          type: LoggerType.error,
          tag: "Sales report",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchSalesProductReport = (req: Request, res: Response) => {
    const storeID = req.body.store;
    const month = req.body.month;
    const year = req.body.year;
    const userID = req.body.userID;

    redisClient
      .get(`users:${userID}`)
      .then((user) => {
        const data = JSON.parse(user!);
        const accessLevel = data.accessLevel;

        if (accessLevel != 0 && accessLevel != 4) {
          return res.status(400).send(ErrorList["ACCESS_DENIED"]);
        } else {
          Promise.all([
            BillModelModel.fetchProductReport(storeID, month, year),
            storeID == null
              ? Promise.resolve([])
              : InvoiceModelModel.fetchProductReport(
                  month,
                  year,
                  accessLevel === 0
                ),
            StockOutModelModel.fetchProductReport(month, year),
          ])
            .then(([bills, invoices, stockouts]) => {
              const billsResult: any[] = [];

              bills.forEach((bill) => {
                const billID = bill._id;
                for (let i = 0; i < bill.items.length; i++) {
                  const itemID = bill.items[i].itemID;
                  // get the sum of stock out
                  console.log(itemID);
                  const stockOut = stockouts.filter(
                    (stockout) =>
                      stockout.billID.toString() === billID.toString() &&
                      stockout.itemID.toString() === itemID._id.toString()
                  );

                  const stockOutPrice = stockOut.reduce(
                    (acc, stockout) =>
                      acc + stockout.stockIn.price * stockout.quantity,
                    0
                  );

                  const averagePrice = stockOutPrice / bill.items[i].quantity;

                  billsResult.push({
                    ID: bill._id,
                    "Bill Number": bill.name,
                    Reference: bill.items[i].itemID.reference,
                    Description: bill.items[i].itemID.description,
                    Quantity: bill.quantity,
                    Price: bill.items[i].price - bill.items[i].discount,
                    COGS: averagePrice,
                  });
                }
              });

              const invoicesResult = [];

              return res.status(200).send({
                bills: billsResult,
                invoices: invoices,
              });
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on fetching sales product report data ${error}`,
                type: LoggerType.error,
                tag: "Sales report",
              }).log();
              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user data ${error}`,
          type: LoggerType.error,
          tag: "Sales report",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchPurchaseReport = (req: Request, res: Response) => {};

  static fetchPurchaseProductReport = (req: Request, res: Response) => {};
}

export default ReportController;
