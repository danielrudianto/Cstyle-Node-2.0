import { model, Schema, Types } from "mongoose";

class GoodReceipt {
  public id?: string;
  public name: string;
  public date: Date;
  public items: GoodReceiptItem[];
  public createdAt: Date;
  public createdBy: string;
  public isDelete: boolean;
  public deleteAt?: Date | null;
  public deletedBy?: string | null;

  constructor(
    name: string,
    date: Date,
    items: GoodReceiptItem[],
    createdBy: string
  ) {
    this.name = name;
    this.date = date;
    this.items = items;
    this.createdAt = new Date();
    this.createdBy = createdBy;
    this.isDelete = false;
  }
}

class GoodReceiptItem {
  public id?: string;
  public itemID: string;
  public quantity: number;

  constructor(itemID: string, quantity: number) {
    this.itemID = itemID;
    this.quantity = quantity;
  }
}

export const GoodReceiptItemSchema = new Schema({
  itemID: { type: Types.ObjectId, required: true, ref: "items" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, required: true },
});

export const GoodReceiptSchema = new Schema({
  name: { type: String, required: true },
  supplierID: { type: Types.ObjectId, required: true, ref: "suppliers" },
  date: { type: Date, required: true },
  note: { type: String, required: false },
  items: [GoodReceiptItemSchema],
  createdAt: { type: Date, required: true },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  isDelete: { type: Boolean, required: true, default: false },
  deletedAt: { type: Date, required: false },
  deletedBy: { type: Types.ObjectId, required: false, ref: "users" },
  isInvoiced: { type: Boolean, required: true, default: false },
});

export default GoodReceiptSchema;
