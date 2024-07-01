import { model, Schema, Types } from "mongoose";

class PurchaseOrder {
  id?: string;
  name: string;
  date: Date;
  status: string;
  orderItems: PurchaseOrderItem[];
  note: string;
  createdBy: string;
  createdAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;

  constructor(
    name: string,
    date: Date,
    status: string,
    orderItems: PurchaseOrderItem[],
    note: string,
    createdBy: string
  ) {
    this.name = name;
    this.date = date;
    this.status = status;
    this.orderItems = orderItems;
    this.note = note;
    this.createdBy = createdBy;
    this.createdAt = new Date();
  }
}

class PurchaseOrderItem {
  id?: string;
  itemID: number;
  quantity: number;
  price: number;
  discount: number;

  constructor(
    itemID: number,
    quantity: number,
    price: number,
    discount: number
  ) {
    this.itemID = itemID;
    this.quantity = quantity;
    this.price = price;
    this.discount = discount;
  }
}

export const PurchaseOrderItemSchema = new Schema({
  itemID: { type: Types.ObjectId, required: true, ref: "items" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, default: "INCOMPLETE" },
  received: { type: Number, required: true, default: 0 },
});

export const PurchaseOrderSchema = new Schema({
  supplierID: { type: Types.ObjectId, required: true, ref: "suppliers" },
  name: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  note: { type: String, required: false },
  status: { type: String, required: true, default: "INCOMPLETE" },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: new Date() },
  items: { type: [PurchaseOrderItemSchema], required: true, default: [] },
});

const PurchaseOrderModel = model("purchase-orders", PurchaseOrderSchema);
export default PurchaseOrderModel;
