import { model, Schema, Types } from "mongoose";

export interface UserPosition {
  id?: string;
  position: string;
  accessLevel: number;
  createdAt: Date;
}

export const UserPositionSchema = new Schema({
  position: { type: String, required: true },
  accessLevel: { type: Number, required: true },
  createdAt: { type: Date, required: true, default: new Date() },
});

export interface User {
  id?: string;
  name: string;
  code: string;
  password: string;
  username: string;
  createdAt: Date;
  createdBy: string | null;
  accessLevel: number;
}

export const UserSchema = new Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: false },
  createdAt: { type: Date, required: true },
  createdBy: {
    type: Types.ObjectId,
    required: false,
    default: null,
    ref: "users",
  },
  isActive: { type: Boolean, required: true, default: true },
  deletedBy: { type: String, required: false, default: null, ref: "users" },
  deletedAt: { type: Date, required: false, default: null },
  accessLevel: { type: Number, required: true },
});

export default UserSchema;
