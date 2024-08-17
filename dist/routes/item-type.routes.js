"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const item_type_controller_1 = __importDefault(require("../controllers/item-type.controller"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.post("/", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("description").notEmpty().withMessage(error_list_1.ErrorList["DESCRIPTION_REQUIRED"]), error_interceptor_1.default.intercept, item_type_controller_1.default.create);
router.put("/", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("description").notEmpty().withMessage(error_list_1.ErrorList["DESCRIPTION_REQUIRED"]), (0, express_validator_1.body)("id").notEmpty().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), error_interceptor_1.default.intercept, item_type_controller_1.default.update);
router.get("/autocomplete", item_type_controller_1.default.fetchAutocomplete);
router.get("/v2", item_type_controller_1.default.fetchV2);
router.get("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, item_type_controller_1.default.fetchByID);
router.delete("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, item_type_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=item-type.routes.js.map