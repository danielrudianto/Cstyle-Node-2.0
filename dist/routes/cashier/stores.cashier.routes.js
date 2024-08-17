"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_interceptor_1 = __importDefault(require("../../interceptors/auth.interceptor"));
const store_controller_1 = __importDefault(require("../../controllers/store.controller"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../../data/error-list");
const error_interceptor_1 = __importDefault(require("../../interceptors/error.interceptor"));
const cashier_controller_1 = __importDefault(require("../../controllers/cashier.controller"));
const router = (0, express_1.Router)();
router.get("/", auth_interceptor_1.default.anyIntercept, store_controller_1.default.fetchOthers);
router.get("/:storeCode", (0, express_validator_1.param)("storeCode").isAlphanumeric().withMessage(error_list_1.ErrorList["UID_INVALID"]), (0, express_validator_1.param)("storeCode")
    .isLength({ min: 32, max: 32 })
    .withMessage(error_list_1.ErrorList["UID_INVALID"]), error_interceptor_1.default.intercept, cashier_controller_1.default.checkStore);
exports.default = router;
//# sourceMappingURL=stores.cashier.routes.js.map