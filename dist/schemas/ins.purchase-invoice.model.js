"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PurchaseInvoiceItemSchema = new mongoose_1.Schema({
    itemID: { type: mongoose_1.Types.ObjectId, required: true, ref: "items" },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
});
const PurchaseInvoiceSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    faktur: { type: String, required: false, default: null },
    supplierID: { type: mongoose_1.Types.ObjectId, required: true, ref: "suppliers" },
    date: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    note: { type: String, required: false },
    items: [PurchaseInvoiceItemSchema],
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    goodReceiptID: { type: mongoose_1.Types.ObjectId, required: true, ref: "good-receipts" },
    createdAt: { type: Date, required: true },
    isDelete: { type: Boolean, required: true, default: false },
    deletedBy: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        default: null,
        ref: "users",
    },
    deletedAt: { type: Date, required: false, default: null },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date, required: false, default: null },
    paidBy: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        default: null,
        ref: "users",
    },
});
exports.default = PurchaseInvoiceSchema;
//# sourceMappingURL=ins.purchase-invoice.model.js.map