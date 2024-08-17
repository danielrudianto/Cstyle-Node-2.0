"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PackingListItemSchema = new mongoose_1.Schema({
    itemID: { type: mongoose_1.Types.ObjectId, required: true, ref: "item" },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
});
const PackingListSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    customerID: { type: mongoose_1.Types.ObjectId, required: true, ref: "customer" },
    date: { type: Date, required: true },
    items: [PackingListItemSchema],
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true, default: new Date() },
    isDelete: { type: Boolean, required: true, default: false },
    deletedBy: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "users",
        default: null,
    },
    deletedAt: { type: Date, required: false, default: null },
    salesID: { type: mongoose_1.Types.ObjectId, required: false, ref: "users" },
    note: { type: String, required: false, default: "" },
});
exports.default = PackingListSchema;
//# sourceMappingURL=ins.packing-list.model.js.map