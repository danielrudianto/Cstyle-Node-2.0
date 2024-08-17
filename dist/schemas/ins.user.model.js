"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = exports.UserPositionSchema = void 0;
const mongoose_1 = require("mongoose");
exports.UserPositionSchema = new mongoose_1.Schema({
    position: { type: String, required: true },
    accessLevel: { type: Number, required: true },
    createdAt: { type: Date, required: true, default: new Date() },
});
exports.UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: false },
    createdAt: { type: Date, required: true },
    createdBy: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        default: null,
        ref: "users",
    },
    isActive: { type: Boolean, required: true, default: true },
    deletedBy: { type: String, required: false, default: null, ref: "users" },
    deletedAt: { type: Date, required: false, default: null },
    accessLevel: { type: Number, required: true },
});
exports.default = exports.UserSchema;
//# sourceMappingURL=ins.user.model.js.map