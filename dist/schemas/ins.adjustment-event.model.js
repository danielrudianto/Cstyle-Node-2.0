"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AdjustmentEventItemSchema = new mongoose_1.Schema({
    itemID: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "items" },
    quantity: { type: Number, required: true },
});
const AdjustmentEventSchema = new mongoose_1.Schema({
    date: { type: Date, required: true },
    name: { type: String, required: true, unique: true },
    items: { type: [AdjustmentEventItemSchema], required: true },
    storeID: { type: mongoose_1.Schema.Types.ObjectId, required: false, ref: "stores" },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true, default: Date.now },
    isDelete: { type: Boolean, required: true, default: false },
    deletedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        default: null,
        ref: "users",
    },
    deletedAt: { type: Date, required: false, default: null },
});
exports.default = AdjustmentEventSchema;
//# sourceMappingURL=ins.adjustment-event.model.js.map