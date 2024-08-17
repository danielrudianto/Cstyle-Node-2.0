import { model, Schema, Types } from "mongoose";

const PackingListItemSchema = new Schema({
  itemID: { type: Types.ObjectId, required: true, ref: "item" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, required: true },
});

const PackingListSchema = new Schema({
  name: { type: String, required: true, trim: true },
  customerID: { type: Types.ObjectId, required: true, ref: "customer" },
  date: { type: Date, required: true },
  items: [PackingListItemSchema],
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: new Date() },
  isDelete: { type: Boolean, required: true, default: false },
  deletedBy: {
    type: Types.ObjectId,
    required: false,
    ref: "users",
    default: null,
  },
  deletedAt: { type: Date, required: false, default: null },
  salesID: { type: Types.ObjectId, required: false, ref: "users" },
  note: { type: String, required: false, default: "" },
});

export default PackingListSchema;
