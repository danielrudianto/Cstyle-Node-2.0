"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const quotation_controller_1 = __importDefault(require("../controllers/quotation.controller"));
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.post("/search/v2", access_interceptor_1.default.salesRequired, quotation_controller_1.default.searchV2);
router.post("/", access_interceptor_1.default.salesRequired, (0, express_validator_1.body)("customer_id").notEmpty().withMessage(error_list_1.ErrorList["CUSTOMER_REQUIRED"]), (0, express_validator_1.body)("items").notEmpty().withMessage(error_list_1.ErrorList["ITEM_REQUIRED"]), (0, express_validator_1.body)("note").exists().withMessage(error_list_1.ErrorList["NOTE_REQUIRED"]), (0, express_validator_1.body)("date").notEmpty().withMessage(error_list_1.ErrorList["DATE_REQUIRED"]), error_interceptor_1.default.intercept, quotation_controller_1.default.create);
router.get("/:id", access_interceptor_1.default.salesRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, quotation_controller_1.default.fetchByID);
router.delete("/:id", access_interceptor_1.default.salesRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, quotation_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=quotation.routes.js.map