"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const membership_controller_1 = __importDefault(require("../controllers/membership.controller"));
const membership_point_controller_1 = __importDefault(require("../controllers/membership-point.controller"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.get("/conversion/history", access_interceptor_1.default.salesRequired, membership_point_controller_1.default.fetch);
router.get("/conversion", access_interceptor_1.default.salesRequired, membership_point_controller_1.default.fetchCurrent);
router.post("/conversion", access_interceptor_1.default.salesRequired, membership_point_controller_1.default.create);
router.get("/:id", access_interceptor_1.default.salesRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), membership_controller_1.default.fetchByID);
router.put("/", access_interceptor_1.default.supervisorRequired, membership_controller_1.default.updateByID);
router.get("/", access_interceptor_1.default.salesRequired, membership_controller_1.default.fetch);
exports.default = router;
//# sourceMappingURL=membership.routes.js.map