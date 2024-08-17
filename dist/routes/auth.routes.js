"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_interceptor_1 = __importDefault(require("../interceptors/auth.interceptor"));
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const error_list_1 = require("../data/error-list");
const router = (0, express_1.Router)();
router.post("/refresh-token", (0, express_validator_1.header)("x-token")
    .notEmpty()
    .withMessage(error_list_1.ErrorList["REFRESH_TOKEN_NOT_FOUND"]), error_interceptor_1.default.intercept, error_interceptor_1.default.authIntercept, auth_controller_1.default.refreshToken);
router.post("/update-password", (0, express_validator_1.body)("oldPassword").exists().withMessage(error_list_1.ErrorList["OLD_PASSWORD_REQUIRED"]), (0, express_validator_1.body)("newPassword").exists().withMessage(error_list_1.ErrorList["NEW_PASSWORD_REQUIRED"]), error_interceptor_1.default.intercept, auth_interceptor_1.default.intercept, auth_controller_1.default.updatePassword);
router.post("/", (0, express_validator_1.body)("username").notEmpty().withMessage(error_list_1.ErrorList["USERNAME_REQUIRED"]), (0, express_validator_1.body)("password").notEmpty().withMessage(error_list_1.ErrorList["PASSWORD_REQUIRED"]), error_interceptor_1.default.intercept, auth_controller_1.default.login);
router.get("/", auth_interceptor_1.default.intercept, auth_controller_1.default.fetchProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map