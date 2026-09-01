import { model, Schema, Types } from "mongoose";

const PurchaseInvoiceItemSchema = new Schema({
  itemID: { type: Types.ObjectId, required: true, ref: "items" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, required: true },
});

const PurchaseInvoiceSchema = new Schema({
  name: { type: String, required: true },
  faktur: { type: String, required: false, default: null },
  supplierID: { type: Types.ObjectId, required: true, ref: "suppliers" },
  date: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  note: { type: String, required: false },
  items: [PurchaseInvoiceItemSchema],
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  goodReceiptID: { type: Types.ObjectId, required: true, ref: "good-receipts" },
  createdAt: { type: Date, required: true },
  isDelete: { type: Boolean, required: true, default: false },
  deletedBy: {
    type: Types.ObjectId,
    required: false,
    default: null,
    ref: "users",
  },
  deletedAt: { type: Date, required: false, default: null },
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date, required: false, default: null },
  paidBy: {
    type: Types.ObjectId,
    required: false,
    default: null,
    ref: "users",
  },
});

export default PurchaseInvoiceSchema;
