"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const itemTypeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now(), required: true },
    isDelete: { type: Boolean, default: false, required: true },
    deletedBy: { type: mongoose_1.Types.ObjectId, default: null },
    deletedAt: { type: Date, default: null },
});
exports.default = itemTypeSchema;
//# sourceMappingURL=master.item-type.model.js.map