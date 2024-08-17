"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const StockInSchema = new mongoose_1.Schema({
    itemID: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "good-receipts",
    },
    adjustmentEventID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "adjustment-events",
    },
    residue: {
        type: Number,
        required: true,
    },
});
exports.default = StockInSchema;
//# sourceMappingURL=impl.stock-in.model.js.map