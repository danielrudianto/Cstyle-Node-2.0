import express from "express";
import path, { join } from "path";

import AuthRoutes from "./routes/auth.route";
import ItemRoutes from "./routes/item.route";
import ItemTypeRoutes from "./routes/item-type.route";
import ItemBrandRoutes from "./routes/item-brand.route";
import CustomerRoutes from "./routes/customer.route";
import SupplierRoutes from "./routes/supplier.route";
import StoreRoutes from "./routes/store.route";
import UserRoutes from "./routes/user.route";
import MembershipRoutes from "./routes/membership.route";

import AdjustmentEventRoutes from "./routes/adjustment.route";
import PackingListRoutes from "./routes/packing-list.route";
import QuotationRoutes from "./routes/quotation.route";
import DeliverySlipRoutes from "./routes/delivery-slip.route";
import GoodReceiptRoutes from "./routes/good-receipt.route";
import StockRequestRoutes from "./routes/stock-request.route";
import ItemStockRoutes from "./routes/item-stock.route";
import BillRoutes from "./routes/bill.route";
import InvoiceRoutes from "./routes/invoice.route";

import CashierRoutes from "./routes/cashier.route";
import MigrationRoutes from "./routes/migration.route";

import StatusRoutes from "./routes/status.route";
import ReportRoutes from "./routes/report.route";

import AuthInterceptor from "./interceptors/auth.interceptor";
import helmet from "helmet";
import { createClient } from "redis";
import LoggerHelper from "./utils/logger.helper";
import { LoggerType } from "./interfaces/logger.interface";

import cors from "cors";

export const app = express();

export const redisClient = createClient();

const allowedOrigins = ["http://localhost:4200", "https://app.cstyle.cloud"];

const options: cors.CorsOptions = {
  origin: allowedOrigins,
};

app.use(cors(options));

app.use("/upload", express.static(path.join(__dirname, "upload")));

app.use(
  express.json({
    limit: "1mb",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.use(express.json({ limit: "50mb" }));
app.use(express.static(join(__dirname, "upload")));

app.use("/auth", AuthRoutes);
app.use("/item", AuthInterceptor.intercept, ItemRoutes);
app.use("/itemType", AuthInterceptor.intercept, ItemTypeRoutes);
app.use("/itemBrand", AuthInterceptor.intercept, ItemBrandRoutes);
app.use("/customer", AuthInterceptor.intercept, CustomerRoutes);
app.use("/supplier", AuthInterceptor.intercept, SupplierRoutes);
app.use("/user", AuthInterceptor.intercept, UserRoutes);
app.use("/store", AuthInterceptor.intercept, StoreRoutes);
app.use("/membership", AuthInterceptor.intercept, MembershipRoutes);
app.use("/item-stock", AuthInterceptor.anyIntercept, ItemStockRoutes);

app.use("/quotation", AuthInterceptor.intercept, QuotationRoutes);
app.use("/packing-list", AuthInterceptor.intercept, PackingListRoutes);
app.use("/delivery-slip", AuthInterceptor.intercept, DeliverySlipRoutes);
app.use("/good-receipt", AuthInterceptor.intercept, GoodReceiptRoutes);
app.use("/stock-transfer", AuthInterceptor.intercept, StockRequestRoutes);
app.use("/invoice", AuthInterceptor.intercept, InvoiceRoutes);
app.use("/bill", AuthInterceptor.intercept, BillRoutes);

app.use("/adjustment", AuthInterceptor.intercept, AdjustmentEventRoutes);
app.use("/cashier", CashierRoutes);
app.use("/migration", MigrationRoutes);

app.use("/status", AuthInterceptor.intercept, StatusRoutes);
app.use("/report", AuthInterceptor.intercept, ReportRoutes);

redisClient.on("error", (error) => {
  new LoggerHelper({
    type: LoggerType.error,
    message: error,
    tag: "Redis",
  }).log();
});
