"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const DeliverySlipItemSchema = new mongoose_1.Schema({
    itemID: { type: mongoose_1.Types.ObjectId, required: true, ref: "items" },
    quantity: { type: Number, required: true },
    returned: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
});
const DeliverySlipSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    customerID: { type: mongoose_1.Types.ObjectId, required: true, ref: "customer" },
    salesID: { type: String, required: false, ref: "users", default: null },
    date: { type: Date, required: true },
    items: [DeliverySlipItemSchema],
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true, default: new Date() },
    isReturn: { type: Boolean, required: true, default: false },
    isDelete: { type: Boolean, required: true, default: false },
    returnedBy: { type: mongoose_1.Types.ObjectId, required: false, ref: "users" },
    returnedAt: { type: Date, required: false, default: null },
    deletedBy: { type: mongoose_1.Types.ObjectId, required: false, ref: "users" },
    deletedAt: { type: Date, required: false, default: null },
});
exports.default = DeliverySlipSchema;
//# sourceMappingURL=ins.delivery-slip.model.js.map