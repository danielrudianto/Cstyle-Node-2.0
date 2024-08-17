"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const packing_list_controller_1 = __importDefault(require("../controllers/packing-list.controller"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const router = (0, express_1.Router)();
router.post("/search/v2", access_interceptor_1.default.salesRequired, packing_list_controller_1.default.fetch);
router.post("/", access_interceptor_1.default.salesRequired, (0, express_validator_1.body)("date").notEmpty().withMessage(error_list_1.ErrorList["DATE_REQUIRED"]), (0, express_validator_1.body)("dueDate").notEmpty().withMessage(error_list_1.ErrorList["DUE_DATE_REQUIRED"]), (0, express_validator_1.body)("note").exists().withMessage(error_list_1.ErrorList["NOTE_REQUIRED"]), (0, express_validator_1.body)("invoiceNote").exists().withMessage(error_list_1.ErrorList["INVOICE_NOTE_REQUIRED"]), (0, express_validator_1.body)("salesID").exists().withMessage(error_list_1.ErrorList["SALES_REQUIRED"]), (0, express_validator_1.body)("customerID").notEmpty().withMessage(error_list_1.ErrorList["CUSTOMER_REQUIRED"]), (0, express_validator_1.body)("items").isArray().withMessage(error_list_1.ErrorList["ITEMS_REQUIRED"]), (0, express_validator_1.body)("items.*.itemID").notEmpty().withMessage(error_list_1.ErrorList["ITEM_REQUIRED"]), (0, express_validator_1.body)("items.*.quantity")
    .notEmpty()
    .withMessage(error_list_1.ErrorList["QUANTITY_REQUIRED"]), (0, express_validator_1.body)("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage(error_list_1.ErrorList["QUANTITY_INVALID"]), (0, express_validator_1.body)("items.*.price")
    .isFloat({ min: 0 })
    .withMessage(error_list_1.ErrorList["PRICE_INVALID"]), error_interceptor_1.default.intercept, packing_list_controller_1.default.create);
router.get("/:id", access_interceptor_1.default.salesRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, packing_list_controller_1.default.fetchByID);
exports.default = router;
//# sourceMappingURL=packing-list.routes.js.map