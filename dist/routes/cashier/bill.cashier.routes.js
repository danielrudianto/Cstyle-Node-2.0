"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_interceptor_1 = __importDefault(require("../../interceptors/auth.interceptor"));
const cashier_controller_1 = __importDefault(require("../../controllers/cashier.controller"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../../data/error-list");
const error_interceptor_1 = __importDefault(require("../../interceptors/error.interceptor"));
const router = (0, express_1.Router)();
router.get("/", auth_interceptor_1.default.anyIntercept, cashier_controller_1.default.fetchBill);
router.get("/:id", auth_interceptor_1.default.anyIntercept, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, cashier_controller_1.default.fetchBillByID);
exports.default = router;
//# sourceMappingURL=bill.cashier.routes.js.map