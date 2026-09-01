import { ObjectId } from "mongodb";
import { model, Schema, Types } from "mongoose";

export interface Customer {
  id?: ObjectId;
  name: string;
  address: string;
  phoneNumber: string | null;
  email: string | null;
  npwp: string | null;
  type: string;
  createdBy: string;
  createdAt: Date;
  isDelete: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
}

const CustomerSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: false, default: null, trim: true },
  email: { type: String, required: false, default: null, trim: true },
  npwp: { type: String, required: false, default: null },
  type: {
    type: String,
    required: true,
    lowercase: true,
    validate: /((retail)|(bulk)|(consignment))/,
  },
  isDelete: { type: Boolean, required: true, default: false },
  deletedAt: { type: Date, required: false, default: null },
  deletedBy: { type: Types.ObjectId, required: false, ref: "users" },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: new Date() },
});

export default CustomerSchema;
