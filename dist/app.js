"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importStar(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const item_routes_1 = __importDefault(require("./routes/item.routes"));
const item_type_routes_1 = __importDefault(require("./routes/item-type.routes"));
const item_brand_routes_1 = __importDefault(require("./routes/item-brand.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const store_routes_1 = __importDefault(require("./routes/store.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const membership_routes_1 = __importDefault(require("./routes/membership.routes"));
const adjustment_routes_1 = __importDefault(require("./routes/adjustment.routes"));
const packing_list_routes_1 = __importDefault(require("./routes/packing-list.routes"));
const quotation_routes_1 = __importDefault(require("./routes/quotation.routes"));
const delivery_slip_routes_1 = __importDefault(require("./routes/delivery-slip.routes"));
const good_receipt_routes_1 = __importDefault(require("./routes/good-receipt.routes"));
const stock_transfer_routes_1 = __importDefault(require("./routes/stock-transfer.routes"));
const item_stock_routes_1 = __importDefault(require("./routes/item-stock.routes"));
const bill_routes_1 = __importDefault(require("./routes/bill.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const cashier_routes_1 = __importDefault(require("./routes/cashier.routes"));
const migration_routes_1 = __importDefault(require("./routes/migration.routes"));
const status_routes_1 = __importDefault(require("./routes/status.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const auth_interceptor_1 = __importDefault(require("./interceptors/auth.interceptor"));
const helmet_1 = __importDefault(require("helmet"));
const redis_1 = require("redis");
const logger_utils_1 = __importDefault(require("./utils/logger.utils"));
const logger_interface_1 = require("./interfaces/logger.interface");
const cors_1 = __importDefault(require("cors"));
exports.app = (0, express_1.default)();
exports.redisClient = (0, redis_1.createClient)();
const allowedOrigins = ["http://localhost:4200", "https://app.cstyle.cloud"];
const options = {
    origin: allowedOrigins,
};
exports.app.use((0, cors_1.default)(options));
exports.app.use("/upload", express_1.default.static(path_1.default.join(__dirname, "upload")));
exports.app.use(express_1.default.json({
    limit: "1mb",
}));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, helmet_1.default)());
exports.app.use(express_1.default.json({ limit: "50mb" }));
exports.app.use(express_1.default.static((0, path_1.join)(__dirname, "upload")));
exports.app.use("/auth", auth_routes_1.default);
exports.app.use("/item", auth_interceptor_1.default.intercept, item_routes_1.default);
exports.app.use("/itemType", auth_interceptor_1.default.intercept, item_type_routes_1.default);
exports.app.use("/itemBrand", auth_interceptor_1.default.intercept, item_brand_routes_1.default);
exports.app.use("/customer", auth_interceptor_1.default.intercept, customer_routes_1.default);
exports.app.use("/supplier", auth_interceptor_1.default.intercept, supplier_routes_1.default);
exports.app.use("/user", auth_interceptor_1.default.intercept, user_routes_1.default);
exports.app.use("/store", auth_interceptor_1.default.intercept, store_routes_1.default);
exports.app.use("/membership", auth_interceptor_1.default.intercept, membership_routes_1.default);
exports.app.use("/item-stock", auth_interceptor_1.default.anyIntercept, item_stock_routes_1.default);
exports.app.use("/quotation", auth_interceptor_1.default.intercept, quotation_routes_1.default);
exports.app.use("/packing-list", auth_interceptor_1.default.intercept, packing_list_routes_1.default);
exports.app.use("/delivery-slip", auth_interceptor_1.default.intercept, delivery_slip_routes_1.default);
exports.app.use("/good-receipt", auth_interceptor_1.default.intercept, good_receipt_routes_1.default);
exports.app.use("/stock-transfer", auth_interceptor_1.default.intercept, stock_transfer_routes_1.default);
exports.app.use("/invoice", auth_interceptor_1.default.intercept, invoice_routes_1.default);
exports.app.use("/bill", auth_interceptor_1.default.intercept, bill_routes_1.default);
exports.app.use("/adjustment", auth_interceptor_1.default.intercept, adjustment_routes_1.default);
exports.app.use("/cashier", cashier_routes_1.default);
exports.app.use("/migration", migration_routes_1.default);
exports.app.use("/status", auth_interceptor_1.default.intercept, status_routes_1.default);
exports.app.use("/report", auth_interceptor_1.default.intercept, report_routes_1.default);
exports.redisClient.on("error", (error) => {
    new logger_utils_1.default({
        type: logger_interface_1.LoggerType.error,
        message: error,
        tag: "Redis",
    }).log();
});
//# sourceMappingURL=app.js.map