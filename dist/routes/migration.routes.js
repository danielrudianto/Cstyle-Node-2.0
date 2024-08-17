"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const migration_controller_1 = __importDefault(require("../controllers/migration.controller"));
const router = (0, express_1.Router)();
router.post("/", migration_controller_1.default.sync);
exports.default = router;
//# sourceMappingURL=migration.routes.js.map