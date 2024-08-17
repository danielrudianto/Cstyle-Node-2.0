"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const customer_controller_1 = __importDefault(require("../controllers/customer.controller"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
router.post("/", access_interceptor_1.default.salesRequired, (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("address").notEmpty().withMessage(error_list_1.ErrorList["ADDRESS_REQUIRED"]), (0, express_validator_1.body)("phone").notEmpty().withMessage(error_list_1.ErrorList["PHONE_NUMBER_REQUIRED"]), (0, express_validator_1.body)("type").notEmpty().withMessage(error_list_1.ErrorList["TYPE_REQUIRED"]), (0, express_validator_1.body)("type")
    .toLowerCase()
    .isIn(["bulk", "consignment"])
    .withMessage(error_list_1.ErrorList["CUSTOMER_TYPE_INVALID"]), error_interceptor_1.default.intercept, customer_controller_1.default.create);
router.put("/v2", access_interceptor_1.default.salesRequired, (0, express_validator_1.body)("id").notEmpty().withMessage(error_list_1.ErrorList["ID_REQUIRED"]), (0, express_validator_1.body)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("name").notEmpty().withMessage(error_list_1.ErrorList["NAME_REQUIRED"]), (0, express_validator_1.body)("address").notEmpty().withMessage(error_list_1.ErrorList["ADDRESS_REQUIRED"]), (0, express_validator_1.body)("phone").notEmpty().withMessage(error_list_1.ErrorList["PHONE_NUMBER_REQUIRED"]), (0, express_validator_1.body)("type").notEmpty().withMessage(error_list_1.ErrorList["TYPE_REQUIRED"]), (0, express_validator_1.body)("type")
    .toLowerCase()
    .isIn(["bulk", "consignment"])
    .withMessage(error_list_1.ErrorList["CUSTOMER_TYPE_INVALID"]), error_interceptor_1.default.intercept, customer_controller_1.default.updateV2);
router.get("/v2", access_interceptor_1.default.salesRequired, customer_controller_1.default.fetchV2);
router.get("/bulk/autocomplete", access_interceptor_1.default.salesRequired, customer_controller_1.default.fetchAutocompleteBulk);
router.get("/consignment/autocomplete", access_interceptor_1.default.salesRequired, customer_controller_1.default.fetchAutocompleteConsignment);
router.get("/:id", access_interceptor_1.default.salesRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, customer_controller_1.default.fetchByID);
router.delete("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, customer_controller_1.default.deleteByID);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map