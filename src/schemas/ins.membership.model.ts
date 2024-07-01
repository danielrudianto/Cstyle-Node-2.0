import { model, Schema, Types } from "mongoose";

export interface Membership {
  _id?: string;
  code: string;
  name: string;
  phoneNumber: string;
  email?: string;
  nationality: string;
  birthday: Date | string;
  createdBy: string;
  createdAt: Date;
  storeID: string | null;
  points: number;
  language: string;
}

const MembershipSchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: false, default: null },
  email: { type: String, required: false, default: null },
  nationality: {
    type: String,
    uppercase: true,
    minLength: 2,
    maxLength: 2,
    required: false,
    default: null,
  },
  birthday: { type: Date, required: false, default: null },
  createdBy: { type: Types.ObjectId, required: false, ref: "users" },
  createdAt: { type: Date, required: true, default: new Date() },
  storeID: {
    type: Types.ObjectId,
    required: false,
    ref: "stores",
    default: null,
  },
  points: { type: Number, required: true, default: 0 },
  language: { type: String, required: true },
});

export default MembershipSchema;
