"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BillItem = new mongoose_1.Schema({
    itemID: { type: mongoose_1.Schema.Types.ObjectId, ref: "items", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
    percentage: { type: Number, required: true },
});
const BillPayment = new mongoose_1.Schema({
    type: { type: String, required: true },
    amount: { type: Number, required: true },
});
const BillSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    storeID: { type: mongoose_1.Schema.Types.ObjectId, ref: "stores", required: true },
    memberID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "memberships",
        required: false,
    },
    items: [BillItem],
    payment: [BillPayment],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "users", required: true },
    createdAt: { type: Date, required: true },
    isDelete: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, required: false, default: null },
    deletedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        required: false,
        default: null,
    },
    isHidden: {
        type: Boolean,
        required: true,
        default: false,
    },
    point: { type: Number, required: true, default: 0 },
});
exports.default = BillSchema;
//# sourceMappingURL=ins.bill.model.js.map