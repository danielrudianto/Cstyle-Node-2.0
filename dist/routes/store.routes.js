"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const error_list_1 = require("../data/error-list");
const store_controller_1 = __importDefault(require("../controllers/store.controller"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.post("/", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["STORE_NAME_REQUIRED"]), (0, express_validator_1.body)("prefix").notEmpty().withMessage(error_list_1.ErrorList["STORE_PREFIX_REQUIRED"]), (0, express_validator_1.body)("phoneNumber")
    .notEmpty()
    .withMessage(error_list_1.ErrorList["STORE_PHONE_NUMBER_REQUIRED"]), (0, express_validator_1.body)("address").notEmpty().withMessage(error_list_1.ErrorList["STORE_ADDRESS_REQUIRED"]), (0, express_validator_1.body)("code").notEmpty().withMessage(error_list_1.ErrorList["CODE_REQUIRED"]), error_interceptor_1.default.intercept, store_controller_1.default.create);
router.get("/autocomplete", store_controller_1.default.fetchAutocomplete);
router.get("/:id", (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, store_controller_1.default.fetchByID);
router.get("/", store_controller_1.default.fetch);
router.put("/", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("id").notEmpty().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["STORE_NAME_REQUIRED"]), (0, express_validator_1.body)("prefix").notEmpty().withMessage(error_list_1.ErrorList["STORE_PREFIX_REQUIRED"]), (0, express_validator_1.body)("phoneNumber")
    .notEmpty()
    .withMessage(error_list_1.ErrorList["STORE_PHONE_NUMBER_REQUIRED"]), (0, express_validator_1.body)("address").notEmpty().withMessage(error_list_1.ErrorList["STORE_ADDRESS_REQUIRED"]), error_interceptor_1.default.intercept, store_controller_1.default.updateByID);
router.delete("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, store_controller_1.default.deleteByID);
exports.default = router;
//# sourceMappingURL=store.routes.js.map