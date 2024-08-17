"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SupplierSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: false, default: null, trim: true },
    email: { type: String, required: false, default: null, trim: true },
    npwp: { type: String, required: false, default: null },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true, default: Date.now() },
    isDelete: { type: Boolean, required: true, default: false },
    deletedBy: { type: mongoose_1.Types.ObjectId, default: null, ref: "users" },
    deletedAt: { type: Date, default: null },
});
exports.default = SupplierSchema;
//# sourceMappingURL=master.supplier.model.js.map