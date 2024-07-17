import mongoose from "mongoose";
import MigrationSchema from "../schemas/impl.migration.model";
import StockInSchema from "../schemas/impl.stock-in.model";
import StockSchema from "../schemas/impl.stock.model";
import AdjustmentEventSchema from "../schemas/ins.adjustment-event.model";
import BillSchema from "../schemas/ins.bill.model";
import DeliverySlipSchema from "../schemas/ins.delivery-slip.model";
import GoodReceiptSchema from "../schemas/ins.good-receipt.model";
import InvoiceSchema from "../schemas/ins.invoice.model";
import MembershipSchema from "../schemas/ins.membership.model";
import PackingListSchema from "../schemas/ins.packing-list.model";
import PointSchema from "../schemas/ins.point.model";
import PurchaseInvoiceSchema from "../schemas/ins.purchase-invoice.model";
import { QuotationSchema } from "../schemas/ins.quotation.model";
import StockRequestSchema from "../schemas/ins.stock-request.model";
import StoreSchema from "../schemas/ins.store.model";
import UserSchema from "../schemas/ins.user.model";
import CustomerSchema from "../schemas/master.customer.model";
import itemBrandSchema from "../schemas/master.item-brand.model";
import itemTypeSchema from "../schemas/master.item-type.model";
import ItemSchema from "../schemas/master.item.model";
import SupplierSchema from "../schemas/master.supplier.model";
import StockOutSchema from "../schemas/impl.stock-out.model";
import StockCardSchema from "../schemas/impl.stock-card.model";
import MembershipPointSchema from "../schemas/ins.point.model";
import OverflowSchema from "../schemas/impl.overflow.model";

export function connectionFactory() {
  const url = "mongodb://127.0.0.1:27017";
  const conn = mongoose.createConnection(url, {
    dbName: "Cstyle",
    autoCreate: true,
  });

  conn.model("migration", MigrationSchema);
  conn.model("adjustment-event", AdjustmentEventSchema);
  conn.model("bills", BillSchema);
  conn.model("delivery-slips", DeliverySlipSchema);
  conn.model("good-receipt", GoodReceiptSchema);
  conn.model("invoices", InvoiceSchema);
  conn.model("memberships", MembershipSchema);
  conn.model("membership-points", MembershipPointSchema);
  conn.model("packing-lists", PackingListSchema);
  conn.model("membership-point", PointSchema);
  conn.model("purchase-invoice", PurchaseInvoiceSchema);
  conn.model("quotations", QuotationSchema);
  conn.model("stock-requests", StockRequestSchema);
  conn.model("stores", StoreSchema);
  conn.model("users", UserSchema);
  conn.model("customer", CustomerSchema);
  conn.model("itembrands", itemBrandSchema);
  conn.model("itemtypes", itemTypeSchema);
  conn.model("items", ItemSchema);
  conn.model("suppliers", SupplierSchema);
  conn.model("packing-list", PackingListSchema);
  conn.model("delivery-slip", DeliverySlipSchema);

  conn.model("stock-ins", StockInSchema);
  conn.model("stock-outs", StockOutSchema);
  conn.model("stock-cards", StockCardSchema);
  conn.model("stocks", StockSchema);
  conn.model("overflows", OverflowSchema);

  return conn;
}
