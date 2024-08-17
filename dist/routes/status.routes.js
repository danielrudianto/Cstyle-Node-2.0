"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const status_controller_1 = __importDefault(require("../controllers/status.controller"));
const router = (0, express_1.Router)();
router.get("/membership", status_controller_1.default.fetchStatusMembership);
router.get("/item", status_controller_1.default.fetchStatusItem);
router.get("/", status_controller_1.default.fetchStatusDashboard);
exports.default = router;
//# sourceMappingURL=status.routes.js.map