import { Types } from "mongoose";
import {
  RemoveStockOutInterface,
  StockOutInterface,
} from "../interfaces/stock-out.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class StockOutModelModel {
  id?: string;
  date: Date;
  billID: string | null;
  adjustmentEventID: string | null;
  invoiceID: string | null;
  quantity: number;
  stockInID: string;

  constructor(data: StockOutInterface) {
    if (data.stockInID == undefined) {
      throw new Error("StockInID not found");
    }

    this.id = data.id;
    this.billID = data.billID;
    this.adjustmentEventID = data.adjustmentEventID;
    this.quantity = data.quantity;
    this.stockInID = data.stockInID!;
    this.invoiceID = data.invoiceID;
    this.date = data.date;
  }

  create() {
    return conn.model("stock-outs").create({
      date: this.date,
      billID: this.billID,
      adjustmentEventID: this.adjustmentEventID,
      invoiceID: this.invoiceID,
      quantity: this.quantity,
      stockInID: this.stockInID,
    });
  }

  static fetchByStockInID(stockInID: string) {
    return conn.model("stock-outs").find({ stockInID: stockInID });
  }

  static fetchDeletation(data: RemoveStockOutInterface) {
    return conn.model("stock-outs").aggregate([
      {
        $lookup: {
          from: "stock-ins",
          localField: "stockInID",
          foreignField: "_id",
          as: "stockIn",
        },
      },
      {
        $unwind: {
          path: "$stockIn",
        },
      },
      {
        $match: {
          billID: data.billID == null ? null : new Types.ObjectId(data.billID),
          invoiceID:
            data.invoiceID == null ? null : new Types.ObjectId(data.invoiceID),
          adjustmentEventID:
            data.adjustmentCaseID == null
              ? null
              : new Types.ObjectId(data.adjustmentCaseID),
          "stockIn.itemID": new Types.ObjectId(data.itemID),
        },
      },
    ]);
  }

  static fetchProductReport(
    storeID: string | null,
    month: number,
    year: number
  ) {
    return conn.model("stock-outs").aggregate([
      {
        $match: {
          $and: [
            {
              date: {
                $gte: new Date(year, month, 1),
              },
            },
            {
              date: {
                $lt: new Date(year, month + 1, 1),
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "stock-ins",
          localField: "stockInID",
          foreignField: "_id",
          as: "stockIn",
        },
      },
      {
        $unwind: {
          path: "$stockIn",
        },
      },
    ]);
  }

  static deleteByID(id: string) {
    return conn.model("stock-outs").findByIdAndDelete(id);
  }
}

export default StockOutModelModel;
