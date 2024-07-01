import { model, Schema, Types } from "mongoose";

export interface ItemType {
  _id?: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  isDelete: boolean;
  deletedBy: string | null;
  deletedAt: Date | null;
}

const itemTypeSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now(), required: true },
  isDelete: { type: Boolean, default: false, required: true },
  deletedBy: { type: Types.ObjectId, default: null },
  deletedAt: { type: Date, default: null },
});

export default itemTypeSchema;
