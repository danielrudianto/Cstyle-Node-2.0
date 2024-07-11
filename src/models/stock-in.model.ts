import { DeleteStockInInterface } from "../interfaces/stock.interface";
import { StockInInterface } from "../interfaces/stock-in.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class StockInModelModel {
  itemID: string;
  quantity: number;
  residue: number;
  price: number;
  goodReceiptID: string | null;
  adjustmentEventID: string | null;
  storeID: string | null;

  constructor(data: StockInInterface) {
    this.itemID = data.itemID;
    this.quantity = data.quantity;
    this.residue = data.residue;
    this.price = data.price;
    this.goodReceiptID = data.goodReceiptID;
    this.adjustmentEventID = data.adjustmentEventID;
    this.storeID = data.storeID;
  }

  create() {
    return conn.model("stock-ins").create(this);
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
      .sort({ _id: 1 });
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
