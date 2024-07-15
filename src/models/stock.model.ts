import { CheckStockInterface } from "../interfaces/check-stock.interface";
import { StockInterface } from "../interfaces/stock.interface";
import { connectionFactory } from "../utils/connector.utils";
import { RemoveStockInInterface } from "src/interfaces/stock-out.interface";

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

  async update() {
    try {
      await conn.model("stocks").findOneAndUpdate(
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
    } catch (error) {
      throw error;
    }
  }

  static checkStockByItemIDs(
    items: CheckStockInterface[],
    storeID: string | null
  ) {
    return conn.model("stocks").find({
      itemID: { $in: items.map((x) => x.itemID) },
      storeID: storeID,
    });
  }

  static checkDashboardStockByItemIDs(
    items: CheckStockInterface[],
    storeID: string | null
  ) {
    return Promise.all([
      conn.model("stocks").aggregate([
        {
          $match: {
            itemID: { $in: items.map((x) => x.itemID) },
            storeID: storeID,
          },
        },
        {
          $group: {
            _id: "$itemID",
            quantity: { $sum: "$quantity" },
          },
        },
      ]),
      conn.model("stocks").aggregate([
        {
          $match: {
            itemID: { $in: items.map((x) => x.itemID) },
            storeID: {
              $ne: storeID,
            },
          },
        },
        {
          $group: {
            _id: "$itemID",
            quantity: { $sum: "$quantity" },
          },
        },
      ]),
    ]);
  }

  static fetch(storeID: string | null, itemIDs: string[]) {
    return Promise.all([]);
  }

  static fetchByStoreID(storeID: string) {
    return conn.model("stocks").find({
      storeID: storeID,
      quantity: {
        $gt: 0,
      },
    });
  }

  static fetchByItemID(itemID: string) {
    return conn
      .model("stocks")
      .find({
        itemID: itemID,
      })
      .populate("storeID", "name address");
  }

  static async removeStockIn(data: RemoveStockInInterface) {
    const result = await conn.model("stock-ins").findOneAndDelete({
      itemID: data.itemID,
      goodReceiptID: data.goodReceiptID,
      adjustmentCaseID: data.adjustmentCaseID,
    });
    const stockIn = result;
    const stockInID = stockIn._id;
    const stockOuts = await conn.model("stock-outs").find({
      stockInID: stockInID,
    });

    for (let i = 0; i < stockOuts.length; i++) {
      await conn.model("overflows").create({
        quantity: stockOuts[i].quantity,
        billID: stockOuts[i].billID,
        invoiceID: stockOuts[i].invoiceID,
        adjustmentEventID: stockOuts[i].adjustmentEventID,
        itemID: stockOuts[i].itemID,
      });

      await conn.model("stock-outs").deleteOne({
        _id: stockOuts[i]._id,
      });
    }

    return true;
  }
}

export default StockModelModel;
