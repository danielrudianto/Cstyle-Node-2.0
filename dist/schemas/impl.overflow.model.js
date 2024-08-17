"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const OverflowSchema = new mongoose_1.Schema({
    quantity: {
        type: Number,
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
    itemID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "items",
    },
});
exports.default = OverflowSchema;
//# sourceMappingURL=impl.overflow.model.js.map