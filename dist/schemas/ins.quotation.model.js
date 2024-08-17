"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationSchema = exports.QuotationItemSchema = void 0;
const mongoose_1 = require("mongoose");
class Quotation {
    constructor(customer_id, date, expiryDate, note, createdBy, createdAt, customer) {
        this.customer_id = customer_id;
        this.date = date;
        this.expiryDate = expiryDate;
        this.note = note;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.customer = customer;
        this.isDelete = false;
    }
}
exports.QuotationItemSchema = new mongoose_1.Schema({
    itemID: { type: mongoose_1.Types.ObjectId, required: true, ref: "items" },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
});
exports.QuotationSchema = new mongoose_1.Schema({
    customerID: { type: mongoose_1.Types.ObjectId, required: true, ref: "customer" },
    name: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    note: { type: String, required: false },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true, default: new Date() },
    deletedBy: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        default: null,
        ref: "users",
    },
    deletedAt: { type: Date, required: false, default: null },
    isDelete: { type: Boolean, required: true, default: false },
    items: { type: [exports.QuotationItemSchema], required: true, default: [] },
});
exports.default = exports.QuotationSchema;
//# sourceMappingURL=ins.quotation.model.js.map