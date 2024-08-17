"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CustomerSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: false, default: null, trim: true },
    email: { type: String, required: false, default: null, trim: true },
    npwp: { type: String, required: false, default: null },
    type: {
        type: String,
        required: true,
        lowercase: true,
        validate: /((retail)|(bulk)|(consignment))/,
    },
    isDelete: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, required: false, default: null },
    deletedBy: { type: mongoose_1.Types.ObjectId, required: false, ref: "users" },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true, default: new Date() },
});
exports.default = CustomerSchema;
//# sourceMappingURL=master.customer.model.js.map