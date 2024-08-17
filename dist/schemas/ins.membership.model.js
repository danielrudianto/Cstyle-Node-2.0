"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MembershipSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: false, default: null },
    email: { type: String, required: false, default: null },
    nationality: {
        type: String,
        uppercase: true,
        minLength: 2,
        maxLength: 2,
        required: false,
        default: null,
    },
    birthday: { type: Date, required: false, default: null },
    createdBy: { type: mongoose_1.Types.ObjectId, required: false, ref: "users" },
    createdAt: { type: Date, required: true, default: new Date() },
    storeID: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "stores",
        default: null,
    },
    points: { type: Number, required: true, default: 0 },
    language: { type: String, required: true },
});
exports.default = MembershipSchema;
//# sourceMappingURL=ins.membership.model.js.map