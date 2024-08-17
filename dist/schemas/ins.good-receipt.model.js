"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoodReceiptSchema = exports.GoodReceiptItemSchema = void 0;
const mongoose_1 = require("mongoose");
class GoodReceipt {
    constructor(name, date, items, createdBy) {
        this.name = name;
        this.date = date;
        this.items = items;
        this.createdAt = new Date();
        this.createdBy = createdBy;
        this.isDelete = false;
    }
}
class GoodReceiptItem {
    constructor(itemID, quantity) {
        this.itemID = itemID;
        this.quantity = quantity;
    }
}
exports.GoodReceiptItemSchema = new mongoose_1.Schema({
    itemID: { type: mongoose_1.Types.ObjectId, required: true, ref: "items" },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
});
exports.GoodReceiptSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    supplierID: { type: mongoose_1.Types.ObjectId, required: true, ref: "suppliers" },
    date: { type: Date, required: true },
    note: { type: String, required: false },
    items: [exports.GoodReceiptItemSchema],
    createdAt: { type: Date, required: true },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    isDelete: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, required: false },
    deletedBy: { type: mongoose_1.Types.ObjectId, required: false, ref: "users" },
    isInvoiced: { type: Boolean, required: true, default: false },
});
exports.default = exports.GoodReceiptSchema;
//# sourceMappingURL=ins.good-receipt.model.js.map