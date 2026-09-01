import { model, Schema } from "mongoose";

const OverflowSchema = new Schema({
  quantity: {
    type: Number,
    required: true,
  },
  billID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "bills",
  },
  adjustmentEventID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "adjustment-events",
  },
  invoiceID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "invoices",
  },
  itemID: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "items",
  },
});

export default OverflowSchema;
