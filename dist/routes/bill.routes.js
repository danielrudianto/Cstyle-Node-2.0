"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bill_controller_1 = __importDefault(require("../controllers/bill.controller"));
const auth_interceptor_1 = __importDefault(require("../interceptors/auth.interceptor"));
const router = (0, express_1.Router)();
router.post("/", auth_interceptor_1.default.intercept, bill_controller_1.default.fetch);
exports.default = router;
//# sourceMappingURL=bill.routes.js.map