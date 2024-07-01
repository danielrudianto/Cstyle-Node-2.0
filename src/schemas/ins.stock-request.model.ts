import { model, Schema, Types } from "mongoose";

export class StockRequest {
  // Can be null if request is from / to office
  requestFrom: string | null;
  requestTo: string | null;
  items: any[];
  note: string;
  userID: string;
  constructor(
    from: string,
    to: string,
    items: any[],
    note: string,
    userID: string
  ) {
    this.requestFrom = from;
    this.requestTo = to;
    this.items = items;
    this.note = note;
    this.userID = userID;
  }
}

const StockRequestItemSchema = new Schema({
  itemID: {
    type: Types.ObjectId,
    required: true,
    ref: "items",
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const StockRequestSchema = new Schema({
  requestFrom: {
    type: Types.ObjectId,
    required: false,
    default: null,
    ref: "stores",
  },
  requestTo: {
    type: Types.ObjectId,
    required: false,
    default: null,
    ref: "stores",
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  items: {
    type: [StockRequestItemSchema],
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  createdBy: {
    type: Types.ObjectId,
    required: true,
    ref: "users",
  },
  note: {
    type: String,
    required: false,
    default: "",
  },
  isSending: {
    type: Boolean,
    required: true,
    default: false,
  },
  sendBy: {
    type: Types.ObjectId,
    required: false,
    ref: "users",
  },
  sendAt: {
    type: Date,
    required: false,
  },
  isConfirm: {
    type: Boolean,
    required: true,
    default: false,
  },
  isReject: {
    type: Boolean,
    required: true,
    default: false,
  },
  updatedBy: {
    type: Types.ObjectId,
    required: false,
    ref: "users",
    default: null,
  },
  updatedAt: {
    type: Date,
    required: false,
    default: null,
  },
  rejectNote: {
    type: String,
    required: false,
    default: "",
  },
  isDelete: {
    type: Boolean,
    required: true,
    default: false,
  },
  deletedBy: {
    type: Types.ObjectId,
    required: false,
    ref: "users",
    default: null,
  },
  deletedAt: {
    type: Date,
    required: false,
    default: null,
  },
});

export default StockRequestSchema;
