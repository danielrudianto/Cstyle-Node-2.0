import { Request, Response } from "express";
import BillModelModel from "../models/bill.model";
import { ErrorList } from "../data/error-list";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import InvoiceModelModel from "../models/invoice.model";
import { redisClient } from "../app";
import StockOutModelModel from "../models/stock-out.model";
import { GoodReceiptModelModel } from "../models/good-receipt.model";
import moment from "moment";

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
                    Store: x.storeID == null ? "" : x.storeID.name,
                    "Bill number": x.name,
                    Date: moment(x.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
                    Time: moment(x.createdAt).format("HH:mm:ss"),
                    Value: x.items.reduce(
                      (acc: any, item: any) =>
                        acc +
                        Math.floor((item.price - item.discount) / 1000) *
                          1000 *
                          item.quantity,
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
                    Remarks: x.isHidden ? "H" : "",
                  };
                }),
                invoices: invoices.map((x, index) => {
                  return {
                    No: index + 1,
                    ID: x._id,
                    "Invoice number": x.name,
                    Date: moment(x.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
                    Time: moment(x.createdAt).format("HH:mm:ss"),
                    Value: x.packingListID.items.reduce(
                      (acc: any, item: any) =>
                        acc +
                        Math.floor((item.price - item.discount) / 1000) *
                          1000 *
                          item.quantity,
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
              ? InvoiceModelModel.fetchProductReport(
                  month,
                  year,
                  accessLevel === 0
                )
              : Promise.resolve([]),
            StockOutModelModel.fetchProductReport(month, year),
          ])
            .then(([bills, invoices, stockouts]) => {
              const billsResult: any[] = [];

              bills.forEach((bill) => {
                const billID = bill._id.toString();
                for (let i = 0; i < bill.items.length; i++) {
                  const itemID = bill.items[i].itemID;
                  const stockOut = stockouts.filter((stockout) => {
                    return (
                      (stockout.billID == null
                        ? null
                        : stockout.billID.toString()) === billID &&
                      stockout.itemID.toString() === itemID._id.toString()
                    );
                  });

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
                    Quantity: bill.items[i].quantity,
                    Price: bill.items[i].price - bill.items[i].discount,
                    COGS: averagePrice,
                  });
                }
              });

              const invoicesResult: any[] = [];

              invoices.forEach((invoice) => {
                const invoiceID = invoice._id.toString();
                if (invoice.packingListID != null) {
                  for (let i = 0; i < invoice.packingListID.items.length; i++) {
                    const itemID = invoice.packingListID.items[i].itemID;
                    const stockOut = stockouts.filter((stockout) => {
                      return (
                        stockout.itemID.toString() === itemID._id.toString() &&
                        stockout.invoiceID.toString() === invoiceID
                      );
                    });

                    const stockOutPrice = stockOut.reduce(
                      (acc, stockout) =>
                        acc + stockout.stockIn.price * stockout.quantity,
                      0
                    );

                    const averagePrice =
                      stockOutPrice / invoice.packingListID.items[i].quantity;

                    invoicesResult.push({
                      ID: invoice._id,
                      "Invoice Number": invoice.name,
                      Reference:
                        invoice.packingListID.items[i].itemID.reference,
                      Description:
                        invoice.packingListID.items[i].itemID.description,
                      Quantity: invoice.packingListID.items[i].quantity,
                      Price:
                        invoice.packingListID.items[i].price -
                        invoice.packingListID.items[i].discount,
                      COGS: averagePrice,
                    });
                  }
                } else if (invoice.deliverySlipID != null) {
                  for (
                    let i = 0;
                    i < invoice.deliverySlipID.items.length;
                    i++
                  ) {
                    const itemID = invoice.deliverySlipID.items[i].itemID;
                    const stockOut = stockouts.filter(
                      (stockout) =>
                        stockout.invoiceID.toString() === invoiceID &&
                        stockout.itemID.toString() === itemID._id.toString()
                    );

                    const stockOutPrice = stockOut.reduce(
                      (acc, stockout) =>
                        acc + stockout.stockIn.price * stockout.quantity,
                      0
                    );

                    const averagePrice =
                      stockOutPrice /
                      (invoice.deliverySlipID.items[i].quantity -
                        invoice.deliverySlipID.items[i].returned);

                    invoicesResult.push({
                      ID: invoice._id,
                      "Invoice Number": invoice.name,
                      Reference:
                        invoice.deliverySlipID.items[i].itemID.reference,
                      Description:
                        invoice.deliverySlipID.items[i].itemID.description,
                      Quantity:
                        invoice.deliverySlipID.items[i].quantity -
                        invoice.deliverySlipID.items[i].returned,
                      Price:
                        invoice.deliverySlipID.items[i].price -
                        invoice.deliverySlipID.items[i].discount,
                      COGS: averagePrice,
                    });
                  }
                }
              });

              return res.status(200).send({
                bills: billsResult,
                invoices: invoicesResult,
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

  static fetchPurchaseReport = (req: Request, res: Response) => {
    const month = req.body.month;
    const year = req.body.year;

    GoodReceiptModelModel.fetchReport(month, year)
      .then((result) => {
        return res.status(200).send({
          data: result.map((x, index) => {
            return {
              No: index + 1,
              ID: x._id,
              "Good Receipt Name": x.name,
              Date: moment(x.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
              Supplier: x.supplierID == null ? "" : x.supplierID.name,
              "Created by": x.createdBy.name,
              Value: x.items.reduce(
                (acc: any, item: any) =>
                  acc + (item.price - item.discount) * item.quantity,
                0
              ),
              Note: x.note,
            };
          }),
        });
      })
      .catch((error) => {
        console.error(`Error on fetching good receipt report ${error}`);
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchPurchaseProductReport = (req: Request, res: Response) => {
    const month = req.body.month;
    const year = req.body.year;

    GoodReceiptModelModel.fetchProductReport(month, year)
      .then((result) => {
        const data: any = [];
        result.forEach((x) => {
          x.items.forEach((y: any) => {
            data.push({
              ID: x._id,
              "Good Receipt Name": x.name,
              Date: moment(x.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
              Supplier: x.supplierID == null ? "" : x.supplierID.name,
              "Created by": x.createdBy.name,
              Reference: y.itemID.reference,
              Description: y.itemID.description,
              Quantity: y.quantity,
              Price: y.price,
              Discount: y.discount,
            });
          });
        });

        return res.status(200).send({
          data: data,
        });
      })
      .catch((error) => {
        console.error(`Error on fetching good receipt report ${error}`);
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static updateSalesReport = (req: Request, res: Response) => {
    const invoices = req.body.invoices;
    const bills = req.body.bills;

    Promise.all([
      InvoiceModelModel.updateReport(invoices),
      BillModelModel.updateReport(bills),
    ])
      .then(() => {
        return res.status(200).send({
          invoices: invoices.length,
          bills: bills.length,
        });
      })
      .catch((error) => {
        console.error(`Error on updating sales report ${error}`);
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default ReportController;
