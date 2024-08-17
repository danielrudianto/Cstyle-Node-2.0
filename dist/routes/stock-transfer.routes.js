"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const stock_request_controller_1 = __importDefault(require("../controllers/stock-request.controller"));
const router = (0, express_1.Router)();
router.post("/unreceived", (0, express_validator_1.body)("requestFrom").exists().withMessage(error_list_1.ErrorList["STORE_ID_REQUIRED"]), error_interceptor_1.default.intercept, stock_request_controller_1.default.fetchUnreceivedRequests);
router.post("/unsent", (0, express_validator_1.body)("requestTo").exists().withMessage(error_list_1.ErrorList["STORE_ID_REQUIRED"]), error_interceptor_1.default.intercept, stock_request_controller_1.default.fetchUnsentRequests);
router.get("/:id", (0, express_validator_1.param)("id").notEmpty().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, stock_request_controller_1.default.fetchByID);
router.post("/send", (0, express_validator_1.body)("id").notEmpty().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("items").notEmpty().withMessage(error_list_1.ErrorList["ITEMS_REQUIRED"]), (0, express_validator_1.body)("items").isArray().withMessage(error_list_1.ErrorList["ITEMS_INVALID"]), error_interceptor_1.default.intercept, stock_request_controller_1.default.send);
router.post("/confirm", (0, express_validator_1.body)("id").notEmpty().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, stock_request_controller_1.default.checkStatus, stock_request_controller_1.default.confirm);
router.post("/reject", (0, express_validator_1.body)("id").notEmpty().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("rejectNote").notEmpty().withMessage(error_list_1.ErrorList["REJECT_NOTE_REQUIRED"]), error_interceptor_1.default.intercept, stock_request_controller_1.default.checkStatus, stock_request_controller_1.default.reject);
router.post("/incomplete", stock_request_controller_1.default.fetchIncompleteRequests);
router.post("/search/v2", stock_request_controller_1.default.searchV2);
router.post("/", stock_request_controller_1.default.create);
router.delete("/:id", (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, stock_request_controller_1.default.deleteByID);
exports.default = router;
//# sourceMappingURL=stock-transfer.routes.js.map