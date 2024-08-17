"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const error_list_1 = require("../data/error-list");
const express_validator_1 = require("express-validator");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const supplier_controller_1 = __importDefault(require("../controllers/supplier.controller"));
const router = (0, express_1.Router)();
router.post("/", (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("address").notEmpty().withMessage(error_list_1.ErrorList["ADDRESS_REQUIRED"]), (0, express_validator_1.body)("phone").notEmpty().withMessage(error_list_1.ErrorList["PHONE_NUMBER_REQUIRED"]), error_interceptor_1.default.intercept, supplier_controller_1.default.create);
router.put("/", (0, express_validator_1.body)("id").notEmpty().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("address").notEmpty().withMessage(error_list_1.ErrorList["ADDRESS_REQUIRED"]), (0, express_validator_1.body)("phone").notEmpty().withMessage(error_list_1.ErrorList["PHONE_NUMBER_REQUIRED"]), error_interceptor_1.default.intercept, supplier_controller_1.default.update);
router.get("/autocomplete", supplier_controller_1.default.fetchAutocomplete);
router.get("/:id", (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, supplier_controller_1.default.fetchByID);
router.get("/", supplier_controller_1.default.fetch);
router.delete("/:id", (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, supplier_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=supplier.routes.js.map