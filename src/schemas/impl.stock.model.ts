import { model, Schema, Types } from "mongoose";

class Stock {
  itemID: String;
  storeID: String | null;
  quantity: Number;

  constructor(itemID: String, storeID: String | null, quantity: Number) {
    this.itemID = itemID;
    this.storeID = storeID;
    this.quantity = quantity;
  }
}

const StockSchema = new Schema({
  itemID: { type: Types.ObjectId, required: true, ref: "items" },
  storeID: { type: Types.ObjectId, required: false, ref: "stores" },
  quantity: { type: Number, required: true },
});

export default StockSchema;
