import { model, Schema, Types } from "mongoose";

const itemBrandSchema = new Schema({
  name: { type: String, unique: false, required: true },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, default: Date.now(), required: true },
  isDelete: { type: Boolean, default: false, required: true },
  deletedBy: { type: Types.ObjectId, default: null },
  deletedAt: { type: Date, default: null },
});

export default itemBrandSchema;
