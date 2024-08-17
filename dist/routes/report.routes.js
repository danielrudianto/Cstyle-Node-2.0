"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = __importDefault(require("../controllers/report.controller"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const router = (0, express_1.Router)();
router.post("/sales", report_controller_1.default.fetchSalesReport);
router.post("/sales-product", report_controller_1.default.fetchSalesProductReport);
router.post("/purchase", access_interceptor_1.default.administratorRequired, report_controller_1.default.fetchPurchaseReport);
router.post("/purchase-product", access_interceptor_1.default.administratorRequired, report_controller_1.default.fetchPurchaseProductReport);
router.put("/sales", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("invoices")
    .isArray()
    .notEmpty()
    .withMessage(error_list_1.ErrorList["INVOICE_REQUIRED"]), (0, express_validator_1.body)("invoices.*.id")
    .isMongoId()
    .withMessage(error_list_1.ErrorList["INVOICE_ID_REQUIRED"]), (0, express_validator_1.body)("bills").isArray().notEmpty().withMessage(error_list_1.ErrorList["BILL_REQUIRED"]), (0, express_validator_1.body)("bills.*.id").isMongoId().withMessage(error_list_1.ErrorList["BILL_ID_REQUIRED"]), error_interceptor_1.default.intercept, report_controller_1.default.updateSalesReport);
exports.default = router;
//# sourceMappingURL=report.routes.js.map