"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MigrationSchema = new mongoose_1.Schema({
    migration_version: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, required: true, default: Date.now },
    command: { type: String, required: true },
});
exports.default = MigrationSchema;
//# sourceMappingURL=impl.migration.model.js.map