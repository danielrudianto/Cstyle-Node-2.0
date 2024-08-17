"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const StockOutSchema = new mongoose_1.Schema({
    itemID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "items",
    },
    quantity: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    billID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "bills",
    },
    adjustmentEventID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "adjustment-events",
    },
    invoiceID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "invoices",
    },
    stockInID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: "stock-ins",
    },
});
exports.default = StockOutSchema;
//# sourceMappingURL=impl.stock-out.model.js.map