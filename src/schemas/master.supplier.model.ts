import { ObjectId } from "mongodb";
import { model, Schema, Types } from "mongoose";

export interface Supplier {
  id?: ObjectId;
  name: string;
  address: string;
  phoneNumber: string | null;
  email: string | null;
  npwp: string | null;
  createdBy: string;
  createdAt: Date;
  isDelete: boolean;
  deletedBy: string | null;
  deletedAt: Date | null;
}

const SupplierSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: false, default: null, trim: true },
  email: { type: String, required: false, default: null, trim: true },
  npwp: { type: String, required: false, default: null },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: Date.now() },
  isDelete: { type: Boolean, required: true, default: false },
  deletedBy: { type: Types.ObjectId, default: null, ref: "users" },
  deletedAt: { type: Date, default: null },
});

export default SupplierSchema;
