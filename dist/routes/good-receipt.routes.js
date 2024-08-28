"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const good_receipt_controller_1 = __importDefault(require("../controllers/good-receipt.controller"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.post("/search", access_interceptor_1.default.administratorRequired, good_receipt_controller_1.default.fetch);
router.post("/", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("supplier").notEmpty().withMessage(error_list_1.ErrorList["SUPPLIER_REQUIRED"]), (0, express_validator_1.body)("date").notEmpty().withMessage(error_list_1.ErrorList["DATE_REQUIRED"]), (0, express_validator_1.body)("items").notEmpty().withMessage(error_list_1.ErrorList["ITEMS_REQUIRED"]), (0, express_validator_1.body)("items").isArray().withMessage(error_list_1.ErrorList["ITEMS_REQUIRED"]), error_interceptor_1.default.intercept, good_receipt_controller_1.default.create);
router.get("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, good_receipt_controller_1.default.fetchByID);
router.put("/", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("supplier").notEmpty().withMessage(error_list_1.ErrorList["SUPPLIER_REQUIRED"]), (0, express_validator_1.body)("date").notEmpty().withMessage(error_list_1.ErrorList["DATE_REQUIRED"]), error_interceptor_1.default.intercept, good_receipt_controller_1.default.updateByID);
router.delete("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, good_receipt_controller_1.default.deleteByID);
exports.default = router;
//# sourceMappingURL=good-receipt.routes.js.map