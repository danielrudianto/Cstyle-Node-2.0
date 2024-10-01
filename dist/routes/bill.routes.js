"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bill_controller_1 = __importDefault(require("../controllers/bill.controller"));
const auth_interceptor_1 = __importDefault(require("../interceptors/auth.interceptor"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.post("/", auth_interceptor_1.default.intercept, bill_controller_1.default.fetch);
router.get("/:id", auth_interceptor_1.default.intercept, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, bill_controller_1.default.fetchByID);
router.delete("/:id", auth_interceptor_1.default.intercept, access_interceptor_1.default.administratorRequired, bill_controller_1.default.deleteByID);
exports.default = router;
//# sourceMappingURL=bill.routes.js.map