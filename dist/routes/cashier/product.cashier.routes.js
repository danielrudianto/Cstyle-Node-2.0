"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_interceptor_1 = __importDefault(require("../../interceptors/auth.interceptor"));
const item_stock_controller_1 = __importDefault(require("../../controllers/item-stock.controller"));
const cashier_controller_1 = __importDefault(require("../../controllers/cashier.controller"));
const item_controller_1 = __importDefault(require("../../controllers/item.controller"));
const router = (0, express_1.Router)();
router.get("/stock", auth_interceptor_1.default.anyIntercept, cashier_controller_1.default.fetchStock);
router.post("/download", auth_interceptor_1.default.anyIntercept, item_controller_1.default.downloadV2);
router.post("/stock", auth_interceptor_1.default.anyIntercept, cashier_controller_1.default.checkStock);
router.post("/", auth_interceptor_1.default.anyIntercept, item_stock_controller_1.default.fetchStockByStoreID);
exports.default = router;
//# sourceMappingURL=product.cashier.routes.js.map