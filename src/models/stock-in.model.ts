import { DeleteStockInInterface } from "../interfaces/stock.interface";
import { StockInInterface } from "../interfaces/stock-in.interface";
import { connectionFactory } from "../utils/connector.utils";
import { RemoveStockInInterface } from "../interfaces/stock-out.interface";

const conn = connectionFactory();
class StockInModelModel {
  itemID: string;
  quantity: number;
  residue: number;
  price: number;
  goodReceiptID: string | null;
  adjustmentEventID: string | null;
  storeID: string | null;
  date: Date;

  constructor(data: StockInInterface) {
    (this.date = data.date), (this.itemID = data.itemID);
    this.quantity = data.quantity;
    this.residue = data.residue;
    this.price = data.price;
    this.goodReceiptID = data.goodReceiptID;
    this.adjustmentEventID = data.adjustmentEventID;
    this.storeID = data.storeID;
  }

  create() {
    return conn.model("stock-ins").create({
      date: this.date,
      itemID: this.itemID,
      quantity: this.quantity,
      residue: this.residue,
      price: this.price,
      goodReceiptID: this.goodReceiptID,
      adjustmentEventID: this.adjustmentEventID,
      storeID: this.storeID,
    });
  }

  static fetchFifo(itemID: string) {
    return conn
      .model("stock-ins")
      .findOne({
        itemID: itemID,
        residue: {
          $gt: 0,
        },
      })
      .sort({ date: 1 });
  }

  static fetchDeletation(data: RemoveStockInInterface) {
    return conn.model("stock-ins").findOne({
      itemID: data.itemID,
      goodReceiptID: data.goodReceiptID,
      adjustmentEventID: data.adjustmentCaseID,
    });
  }

  static updateResidue(stockInID: string, decr: number) {
    return conn.model("stock-ins").findByIdAndUpdate(stockInID, {
      $inc: {
        residue: -1 * decr,
      },
    });
  }

  static delete(data: DeleteStockInInterface) {
    return conn.model("stock-ins").findOneAndDelete({
      goodReceiptID: data.goodReceiptID,
      adjustmentEventID: data.adjustmentEventID,
      itemID: data.itemID,
    });
  }
}

export default StockInModelModel;
