"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionFactory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const impl_migration_model_1 = __importDefault(require("../schemas/impl.migration.model"));
const impl_stock_in_model_1 = __importDefault(require("../schemas/impl.stock-in.model"));
const impl_stock_model_1 = __importDefault(require("../schemas/impl.stock.model"));
const ins_adjustment_event_model_1 = __importDefault(require("../schemas/ins.adjustment-event.model"));
const ins_bill_model_1 = __importDefault(require("../schemas/ins.bill.model"));
const ins_delivery_slip_model_1 = __importDefault(require("../schemas/ins.delivery-slip.model"));
const ins_good_receipt_model_1 = __importDefault(require("../schemas/ins.good-receipt.model"));
const ins_invoice_model_1 = __importDefault(require("../schemas/ins.invoice.model"));
const ins_membership_model_1 = __importDefault(require("../schemas/ins.membership.model"));
const ins_packing_list_model_1 = __importDefault(require("../schemas/ins.packing-list.model"));
const ins_point_model_1 = __importDefault(require("../schemas/ins.point.model"));
const ins_purchase_invoice_model_1 = __importDefault(require("../schemas/ins.purchase-invoice.model"));
const ins_quotation_model_1 = __importDefault(require("../schemas/ins.quotation.model"));
const ins_stock_request_model_1 = __importDefault(require("../schemas/ins.stock-request.model"));
const ins_store_model_1 = __importDefault(require("../schemas/ins.store.model"));
const ins_user_model_1 = __importDefault(require("../schemas/ins.user.model"));
const master_customer_model_1 = __importDefault(require("../schemas/master.customer.model"));
const master_item_brand_model_1 = __importDefault(require("../schemas/master.item-brand.model"));
const master_item_type_model_1 = __importDefault(require("../schemas/master.item-type.model"));
const master_item_model_1 = __importDefault(require("../schemas/master.item.model"));
const master_supplier_model_1 = __importDefault(require("../schemas/master.supplier.model"));
const impl_stock_out_model_1 = __importDefault(require("../schemas/impl.stock-out.model"));
const impl_stock_card_model_1 = __importDefault(require("../schemas/impl.stock-card.model"));
const ins_point_model_2 = __importDefault(require("../schemas/ins.point.model"));
const impl_overflow_model_1 = __importDefault(require("../schemas/impl.overflow.model"));
function connectionFactory() {
    const url = "mongodb://127.0.0.1:27017";
    const conn = mongoose_1.default.createConnection(url, {
        dbName: "Cstyle_dev",
        autoCreate: true,
    });
    conn.model("migrations", impl_migration_model_1.default);
    conn.model("adjustment-event", ins_adjustment_event_model_1.default);
    conn.model("bills", ins_bill_model_1.default);
    conn.model("delivery-slips", ins_delivery_slip_model_1.default);
    conn.model("good-receipt", ins_good_receipt_model_1.default);
    conn.model("invoices", ins_invoice_model_1.default);
    conn.model("memberships", ins_membership_model_1.default);
    conn.model("membership-points", ins_point_model_2.default);
    conn.model("packing-lists", ins_packing_list_model_1.default);
    conn.model("membership-point", ins_point_model_1.default);
    conn.model("purchase-invoice", ins_purchase_invoice_model_1.default);
    conn.model("quotations", ins_quotation_model_1.default);
    conn.model("stock-requests", ins_stock_request_model_1.default);
    conn.model("stores", ins_store_model_1.default);
    conn.model("users", ins_user_model_1.default);
    conn.model("customer", master_customer_model_1.default);
    conn.model("itembrands", master_item_brand_model_1.default);
    conn.model("itemtypes", master_item_type_model_1.default);
    conn.model("items", master_item_model_1.default);
    conn.model("suppliers", master_supplier_model_1.default);
    conn.model("stock-ins", impl_stock_in_model_1.default);
    conn.model("stock-outs", impl_stock_out_model_1.default);
    conn.model("stock-cards", impl_stock_card_model_1.default);
    conn.model("stocks", impl_stock_model_1.default);
    conn.model("overflows", impl_overflow_model_1.default);
    return conn;
}
exports.connectionFactory = connectionFactory;
//# sourceMappingURL=connector.utils.js.map