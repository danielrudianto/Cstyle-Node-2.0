"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_interceptor_1 = __importDefault(require("../../interceptors/auth.interceptor"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../../data/error-list");
const error_interceptor_1 = __importDefault(require("../../interceptors/error.interceptor"));
const membership_controller_1 = __importDefault(require("../../controllers/membership.controller"));
const router = (0, express_1.Router)();
router.post("/", auth_interceptor_1.default.anyIntercept, (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("code").notEmpty().withMessage(error_list_1.ErrorList["CODE_REQUIRED"]), (0, express_validator_1.body)("language").notEmpty().withMessage(error_list_1.ErrorList["LANGUAGE_REQUIRED"]), (0, express_validator_1.body)("language")
    .isIn(["EN", "ID"])
    .withMessage(error_list_1.ErrorList["LANGUAGE_INVALID"]), (0, express_validator_1.body)("phoneNumber").custom((value, { req }) => {
    if (!value && !req.body.email) {
        throw new Error(error_list_1.ErrorList["PHONE_EMAIL_REQUIRED"]);
    }
    return true;
}), error_interceptor_1.default.intercept, membership_controller_1.default.create);
router.get("/code/:membershipCode", auth_interceptor_1.default.anyIntercept, (0, express_validator_1.param)("membershipCode")
    .isAlphanumeric()
    .withMessage(error_list_1.ErrorList["UID_INVALID"]), error_interceptor_1.default.intercept, membership_controller_1.default.fetchByCode);
router.get("/", membership_controller_1.default.fetch);
exports.default = router;
//# sourceMappingURL=membership.cashier.routes.js.map