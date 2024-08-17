"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const StockCardSchema = new mongoose_1.Schema({
    itemID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "items",
    },
    storeID: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "bills",
    },
    invoiceID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "invoices",
    },
    adjustmentEventID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "adjustment-events",
    },
    goodReceiptID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "good-receipts",
    },
    deliverySlipID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "delivery-slips"
    }
});
exports.default = StockCardSchema;
//# sourceMappingURL=impl.stock-card.model.js.map