"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const itemBrandSchema = new mongoose_1.Schema({
    name: { type: String, unique: false, required: true },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, default: Date.now(), required: true },
    isDelete: { type: Boolean, default: false, required: true },
    deletedBy: { type: mongoose_1.Types.ObjectId, default: null },
    deletedAt: { type: Date, default: null },
});
exports.default = itemBrandSchema;
//# sourceMappingURL=master.item-brand.model.js.map