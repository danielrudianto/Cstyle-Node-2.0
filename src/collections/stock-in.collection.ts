import { model, Schema } from "mongoose";

const StockInSchema = new Schema({
  itemID: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  goodReceiptID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "good-receipts",
  },
  adjustmentEventID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "adjustment-events",
  },
  residue: {
    type: Number,
    required: true,
  },
});

export default StockInSchema;
