"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const InvoiceItemSchema = new mongoose_1.Schema({
    itemID: { type: mongoose_1.Types.ObjectId, required: true, ref: "items" },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
});
const InvoicePaymentSchema = new mongoose_1.Schema({
    amount: { type: Number, required: true },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["cash", "transfer"],
    },
    paidAt: { type: Date, required: true },
    paidBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
});
const InvoiceSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    packingListID: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "packing-lists",
    },
    deliverySlipID: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "delivery-slips",
    },
    customerID: { type: mongoose_1.Types.ObjectId, required: true, ref: "customer" },
    salesID: { type: mongoose_1.Types.ObjectId, required: false, ref: "users" },
    date: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true },
    note: { type: String, required: false },
    isHidden: { type: Boolean, required: true, default: false },
    isPaid: { type: Boolean, required: true, default: false },
    payments: { type: [InvoicePaymentSchema], required: true },
    isDelete: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, required: false },
    deletedBy: { type: mongoose_1.Types.ObjectId, required: false, ref: "users" },
});
exports.default = InvoiceSchema;
//# sourceMappingURL=ins.invoice.model.js.map