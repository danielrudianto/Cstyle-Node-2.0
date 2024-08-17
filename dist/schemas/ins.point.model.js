"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MembershipPointSchema = new mongoose_1.Schema({
    conversion: { type: Number, required: true },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "users" },
    createdAt: { type: Date, required: true, default: Date.now },
});
exports.default = MembershipPointSchema;
//# sourceMappingURL=ins.point.model.js.map