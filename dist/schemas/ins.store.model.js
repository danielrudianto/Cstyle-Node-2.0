"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const StoreSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: false },
    prefix: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true, default: new Date() },
    isActive: { type: Boolean, required: true, default: true },
    deletedBy: { type: mongoose_1.Types.ObjectId, required: false, default: null },
    deletedAt: { type: Date, required: false, default: null },
});
exports.default = StoreSchema;
//# sourceMappingURL=ins.store.model.js.map