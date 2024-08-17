"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.post("/reset-password", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("id").notEmpty().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), error_interceptor_1.default.intercept, user_controller_1.default.resetPassword);
router.post("/", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("username").notEmpty().withMessage(error_list_1.ErrorList["USERNAME_REQUIRED"]), (0, express_validator_1.body)("accessLevel").isInt().withMessage(error_list_1.ErrorList["ACCESS_LEVEL_REQUIRED"]), error_interceptor_1.default.intercept, user_controller_1.default.create);
router.get("/sales/autocomplete", user_controller_1.default.fetchSales);
router.get("/:id", (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, user_controller_1.default.fetchByID);
router.get("/", user_controller_1.default.fetch);
router.put("/", (0, express_validator_1.body)("id").exists().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("username").notEmpty().withMessage(error_list_1.ErrorList["USERNAME_REQUIRED"]), (0, express_validator_1.body)("accessLevel").isInt().withMessage(error_list_1.ErrorList["ACCESS_LEVEL_REQUIRED"]), error_interceptor_1.default.intercept, user_controller_1.default.updateByID);
router.delete("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, user_controller_1.default.deleteByID);
exports.default = router;
//# sourceMappingURL=user.routes.js.map