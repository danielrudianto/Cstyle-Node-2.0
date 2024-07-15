import { Request, Response } from "express";
import BillModelModel from "../models/bill.model";

class ReportController {
  static fetchSalesReport = (req: Request, res: Response) => {
    const storeID = req.body.storeID;
    const month = req.body.month;
    const year = req.body.year;

    Promise.all([BillModelModel.fetchReport(storeID, month, year)]);
  };

  static fetchSalesProductReport = (req: Request, res: Response) => {
    const storeID = req.body.storeID;
    const month = req.body.month;
    const year = req.body.year;
  };

  static fetchPurchaseReport = (req: Request, res: Response) => {};

  static fetchPurchaseProductReport = (req: Request, res: Response) => {};
}

export default ReportController;
