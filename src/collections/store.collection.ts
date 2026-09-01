import { model, Schema, Types } from "mongoose";

export interface Store {
  _id?: string;
  name: string;
  address: string;
  phoneNumber: string;
}

const StoreSchema = new Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: false },
  prefix: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: new Date() },
  isActive: { type: Boolean, required: true, default: true },
  deletedBy: { type: Types.ObjectId, required: false, default: null },
  deletedAt: { type: Date, required: false, default: null },
});

export default StoreSchema;
