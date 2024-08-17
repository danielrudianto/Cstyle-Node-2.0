"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ItemSchema = new mongoose_1.Schema({
    reference: { type: String, unique: false, required: true },
    description: { type: String, required: true },
    itemTypeID: { type: mongoose_1.Types.ObjectId, required: true, ref: "itemtypes" },
    itemBrandID: { type: mongoose_1.Types.ObjectId, required: true, ref: "itembrands" },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true, default: Date.now() },
    isDelete: { type: Boolean, required: true, default: false },
    deletedBy: { type: mongoose_1.Types.ObjectId, default: null, ref: "users" },
    deletedAt: { type: Date, default: null },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, default: 0 },
    barcode: { type: String, required: false, default: "" },
    isFavorite: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
});
exports.default = ItemSchema;
//# sourceMappingURL=master.item.model.js.map