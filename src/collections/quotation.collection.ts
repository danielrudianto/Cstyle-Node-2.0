import { model, Schema, Types } from "mongoose";
import { Customer } from "./customer.collection";

class Quotation {
  id?: string;
  customer_id: string;
  date: Date;
  expiryDate: Date;
  note: string;
  createdBy?: string;
  createdAt?: Date;
  customer?: Customer;
  isDelete: boolean;
  deletedBy?: string;
  deletedAt?: Date;

  constructor(
    customer_id: string,
    date: Date,
    expiryDate: Date,
    note: string,
    createdBy?: string,
    createdAt?: Date,
    customer?: Customer
  ) {
    this.customer_id = customer_id;
    this.date = date;
    this.expiryDate = expiryDate;
    this.note = note;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.customer = customer;
    this.isDelete = false;
  }
}

export const QuotationItemSchema = new Schema({
  itemID: { type: Types.ObjectId, required: true, ref: "items" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, required: true, default: 0 },
});

export const QuotationSchema = new Schema({
  customerID: { type: Types.ObjectId, required: true, ref: "customer" },
  name: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  note: { type: String, required: false },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: new Date() },
  deletedBy: {
    type: Types.ObjectId,
    required: false,
    default: null,
    ref: "users",
  },
  deletedAt: { type: Date, required: false, default: null },
  isDelete: { type: Boolean, required: true, default: false },
  items: { type: [QuotationItemSchema], required: true, default: [] },
});

export default QuotationSchema;
