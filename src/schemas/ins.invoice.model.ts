import { model, Schema, Types } from "mongoose";

const InvoiceItemSchema = new Schema({
  itemID: { type: Types.ObjectId, required: true, ref: "items" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, required: true },
});

const InvoicePaymentSchema = new Schema({
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["cash", "transfer"],
  },
  paidAt: { type: Date, required: true },
  paidBy: { type: Types.ObjectId, required: true, ref: "users" },
});

const InvoiceSchema = new Schema({
  name: { type: String, required: true },
  packingListID: {
    type: Types.ObjectId,
    required: false,
    ref: "packing-lists",
  },
  deliverySlipID: {
    type: Types.ObjectId,
    required: false,
    ref: "delivery-slips",
  },
  customerID: { type: Types.ObjectId, required: true, ref: "customer" },
  salesID: { type: Types.ObjectId, required: false, ref: "users" },
  date: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true },
  note: { type: String, required: false },
  isHidden: { type: Boolean, required: true, default: false },
  isPaid: { type: Boolean, required: true, default: false },
  payments: { type: [InvoicePaymentSchema], required: true },
  isDelete: { type: Boolean, required: true, default: false },
  deletedAt: { type: Date, required: false },
  deletedBy: { type: Types.ObjectId, required: false, ref: "users" },
});

export default InvoiceSchema;
