"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = __importDefault(require("../controllers/invoice.controller"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.post("/search/v2", access_interceptor_1.default.salesRequired, invoice_controller_1.default.fetch);
router.post("/payment", access_interceptor_1.default.salesRequired, (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("paidAt").exists().withMessage(error_list_1.ErrorList["DATE_REQUIRED"]), (0, express_validator_1.body)("paymentMethod")
    .exists()
    .withMessage(error_list_1.ErrorList["PAYMENT_METHOD_REQUIRED"]), (0, express_validator_1.body)("paymentMethod")
    .isIn(["cash", "transfer"])
    .withMessage(error_list_1.ErrorList["PAYMENT_METHOD_INVALID"]), (0, express_validator_1.body)("amount").isFloat({ min: 0 }).withMessage(error_list_1.ErrorList["AMOUNT_INVALID"]), error_interceptor_1.default.intercept, invoice_controller_1.default.updatePayment);
router.get("/:id", access_interceptor_1.default.salesRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, invoice_controller_1.default.fetchByID);
router.delete("/payment/:id", access_interceptor_1.default.salesRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, invoice_controller_1.default.deletePaymentByID);
router.delete("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, invoice_controller_1.default.deleteByID);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map