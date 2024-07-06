import { Schema } from "mongoose";

const StockCardSchema = new Schema({
  itemID: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "items",
  },
  storeID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "stores",
  },
  quantity: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  billID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "bills",
  },
  invoiceID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "invoices",
  },
  adjustmentEventID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "adjustment-events",
  },
  goodReceiptID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "good-receipts",
  },
  deliverySlipID: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "delivery-slips"
  }
});

export default StockCardSchema;
