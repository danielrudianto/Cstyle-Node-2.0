"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_interceptor_1 = __importDefault(require("../interceptors/auth.interceptor"));
const cashier_controller_1 = __importDefault(require("../controllers/cashier.controller"));
const stores_cashier_routes_1 = __importDefault(require("./cashier/stores.cashier.routes"));
const stock_transfer_cashier_routes_1 = __importDefault(require("./cashier/stock-transfer.cashier.routes"));
const product_cashier_routes_1 = __importDefault(require("./cashier/product.cashier.routes"));
const membership_cashier_routes_1 = __importDefault(require("./cashier/membership.cashier.routes"));
const router = (0, express_1.Router)();
router.use("/stores", stores_cashier_routes_1.default);
router.use("/stock-transfer", stock_transfer_cashier_routes_1.default);
router.use("/products", product_cashier_routes_1.default);
router.use("/membership", membership_cashier_routes_1.default);
router.get("/stats", auth_interceptor_1.default.anyIntercept, cashier_controller_1.default.stats);
router.get("/report", auth_interceptor_1.default.anyIntercept, cashier_controller_1.default.fetchReport);
router.post("/sync", auth_interceptor_1.default.anyIntercept, cashier_controller_1.default.sync);
exports.default = router;
//# sourceMappingURL=cashier.routes.js.map