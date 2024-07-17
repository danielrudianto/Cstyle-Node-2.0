import {
  RemoveStockOutInterface,
  StockOutInterface,
} from "../interfaces/stock-out.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class StockOutModelModel {
  id?: string;
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
  }

  create() {
    return conn.model("stock-outs").create({
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
    return conn.model("stock-outs").find({
      billID: data.billID,
      invoiceID: data.invoiceID,
      adjustmentEventID: data.adjustmentCaseID,
      itemID: data.itemID,
      storeID: data.storeID,
    });
  }

  static deleteByID(id: string) {
    return conn.model("stock-outs").deleteOne({ _id: id });
  }
}

export default StockOutModelModel;
