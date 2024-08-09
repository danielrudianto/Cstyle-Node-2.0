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
            InvoiceModelModel.fetchReport(month, year, accessLevel === 0),
          ])
            .then(([bills, invoices]) => {
              return res.status(200).send({
                bills: bills,
                invoices: invoices,
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
            InvoiceModelModel.fetchProductReport(
              month,
              year,
              accessLevel === 0
            ),
            StockOutModelModel.fetchProductReport(storeID, month, year),
          ])
            .then(([bills, invoices, stockouts]) => {
              const billsResult = [];

              const invoicesResult = [];
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
