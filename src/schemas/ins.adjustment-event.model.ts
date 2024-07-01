import { model, Schema } from "mongoose";

const AdjustmentEventItemSchema = new Schema({
  itemID: { type: Schema.Types.ObjectId, required: true, ref: "items" },
  quantity: { type: Number, required: true },
});

const AdjustmentEventSchema = new Schema({
  date: { type: Date, required: true },
  name: { type: String, required: true, unique: true },
  items: { type: [AdjustmentEventItemSchema], required: true },
  storeID: { type: Schema.Types.ObjectId, required: false, ref: "stores" },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: Date.now },
  isDelete: { type: Boolean, required: true, default: false },
  deletedBy: {
    type: Schema.Types.ObjectId,
    required: false,
    default: null,
    ref: "users",
  },
  deletedAt: { type: Date, required: false, default: null },
});

export default AdjustmentEventSchema;
