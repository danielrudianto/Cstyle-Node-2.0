import { model, Schema, Types } from "mongoose";

const MembershipPointSchema = new Schema({
  conversion: { type: Number, required: true },
  createdBy: { type: Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: Date.now },
});

export default MembershipPointSchema;
