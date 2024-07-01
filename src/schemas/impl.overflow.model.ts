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
  stockInID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "stock-ins",
  },
});

export default OverflowSchema;
