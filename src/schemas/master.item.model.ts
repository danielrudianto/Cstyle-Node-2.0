import { model, Schema, Types } from "mongoose";

export interface Item {
  reference: string;
  description: string;
  itemTypeID: string;
  itemBrandID: string;
  createdBy: string;
  createdAt: Date;
  isDelete: boolean;
  deletedBy: string | null;
  deletedAt: Date | null;
  price: number;
  id?: string;
  barcode: string | null;
  images: string[];
  isActive: boolean;
}

const ItemSchema = new Schema({
  reference: { type: String, unique: false, required: true },
  description: { type: String, required: true },
  itemTypeID: { type: Types.ObjectId, required: true, ref: "itemtypes" },
  itemBrandID: { type: Types.ObjectId, required: true, ref: "itembrands" },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: Date.now() },
  isDelete: { type: Boolean, required: true, default: false },
  deletedBy: { type: Types.ObjectId, default: null, ref: "users" },
  deletedAt: { type: Date, default: null },
  images: { type: [String], default: [] },
  price: { type: Number, required: true, default: 0 },
  barcode: { type: String, required: false, default: "" },
  isFavorite: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
});

export default ItemSchema;
