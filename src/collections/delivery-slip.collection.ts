import { model, Schema, Types } from "mongoose";

const DeliverySlipItemSchema = new Schema({
  itemID: { type: Types.ObjectId, required: true, ref: "items" },
  quantity: { type: Number, required: true },
  returned: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  discount: { type: Number, required: true },
});

const DeliverySlipSchema = new Schema({
  name: { type: String, required: true, trim: true },
  customerID: { type: Types.ObjectId, required: true, ref: "customer" },
  salesID: { type: String, required: false, ref: "users", default: null },
  date: { type: Date, required: true },
  items: [DeliverySlipItemSchema],
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: new Date() },
  isReturn: { type: Boolean, required: true, default: false },
  isDelete: { type: Boolean, required: true, default: false },
  returnedBy: { type: Types.ObjectId, required: false, ref: "users" },
  returnedAt: { type: Date, required: false, default: null },
  deletedBy: { type: Types.ObjectId, required: false, ref: "users" },
  deletedAt: { type: Date, required: false, default: null },
});

export default DeliverySlipSchema;
