"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adjustment_event_controller_1 = __importDefault(require("../controllers/adjustment-event.controller"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.post("/search/v2", access_interceptor_1.default.supervisorRequired, adjustment_event_controller_1.default.fetch);
router.post("/", access_interceptor_1.default.supervisorRequired, (0, express_validator_1.body)("date").notEmpty().withMessage(error_list_1.ErrorList["DATE_REQUIRED"]), (0, express_validator_1.body)("items").notEmpty().withMessage(error_list_1.ErrorList["ITEMS_REQUIRED"]), (0, express_validator_1.body)("items").isArray().withMessage(error_list_1.ErrorList["ITEMS_REQUIRED"]), (0, express_validator_1.body)("store").exists().withMessage(error_list_1.ErrorList["STORE_ID_REQUIRED"]), error_interceptor_1.default.intercept, adjustment_event_controller_1.default.create);
router.get("/:id", access_interceptor_1.default.supervisorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, adjustment_event_controller_1.default.fetchByID);
router.delete("/:id", access_interceptor_1.default.supervisorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, adjustment_event_controller_1.default.deleteByID);
exports.default = router;
//# sourceMappingURL=adjustment.routes.js.map