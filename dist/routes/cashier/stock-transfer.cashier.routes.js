"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_interceptor_1 = __importDefault(require("../../interceptors/auth.interceptor"));
const stock_request_controller_1 = __importDefault(require("../../controllers/stock-request.controller"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../../data/error-list");
const error_interceptor_1 = __importDefault(require("../../interceptors/error.interceptor"));
const router = (0, express_1.Router)();
router.get("/unsent", auth_interceptor_1.default.anyIntercept, (req, res, next) => {
    req.body.requestTo = req.body.storeID;
    req.body.page = !req.query.page ? 1 : parseInt(req.query.page);
    next();
}, stock_request_controller_1.default.fetchUnsentRequests);
router.get("/unreceived", auth_interceptor_1.default.anyIntercept, (req, res, next) => {
    req.body.requestFrom = req.body.storeID;
    req.body.page = !req.query.page ? 1 : parseInt(req.query.page);
    next();
}, stock_request_controller_1.default.fetchUnreceivedRequests);
router.get("/:id", (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, auth_interceptor_1.default.anyIntercept, stock_request_controller_1.default.fetchByID);
router.post("/", auth_interceptor_1.default.anyIntercept, stock_request_controller_1.default.create);
router.post("/send", (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, auth_interceptor_1.default.anyIntercept, (req, res, next) => {
    req.body.userID = req.body.employeeID;
    next();
}, stock_request_controller_1.default.send);
router.post("/receive", auth_interceptor_1.default.anyIntercept, (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (req, res, next) => {
    req.body.userID = req.body.employeeID;
    next();
}, stock_request_controller_1.default.receive);
router.post("/reject", (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("rejectNote").notEmpty().withMessage(error_list_1.ErrorList["REJECT_NOTE_REQUIRED"]), error_interceptor_1.default.intercept, auth_interceptor_1.default.anyIntercept, (req, res, next) => {
    req.body.userID = req.body.employeeID;
    next();
}, stock_request_controller_1.default.reject);
exports.default = router;
//# sourceMappingURL=stock-transfer.cashier.routes.js.map