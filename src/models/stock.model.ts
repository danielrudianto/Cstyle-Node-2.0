import { CheckStockInterface } from "../interfaces/check-stock.interface";
import { StockInterface } from "../interfaces/stock.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class StockModelModel {
  itemID: string;
  storeID: string | null;
  quantity: number;
  constructor(data: StockInterface) {
    this.itemID = data.itemID;
    this.storeID = data.storeID;
    this.quantity = data.quantity;
  }

  update() {
    return conn.model("stock").findOneAndUpdate(
      {
        storeID: this.storeID,
        itemID: this.itemID,
      },
      {
        $inc: {
          quantity: this.quantity,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );
  }

  static checkStockByItemIDs(
    items: CheckStockInterface[],
    storeID: string | null
  ) {
    return conn.model("stock").find({
      itemID: { $in: items.map((x) => x.itemID) },
      storeID: storeID,
    });
  }

  static fetchByStoreID(storeID: string) {
    return conn.model("stock").find({
      storeID: storeID,
      quantity: {
        $gt: 0,
      },
    });
  }
}

export default StockModelModel;
