import express from "express";
import path, { join } from "path";

import AuthRoutes from "./routes/auth.routes";
import ItemRoutes from "./routes/item.routes";
import ItemTypeRoutes from "./routes/item-type.routes";
import ItemBrandRoutes from "./routes/item-brand.routes";
import CustomerRoutes from "./routes/customer.routes";
import SupplierRoutes from "./routes/supplier.routes";
import StoreRoutes from "./routes/store.routes";
import UserRoutes from "./routes/user.routes";
import MembershipRoutes from "./routes/membership.routes";

import AdjustmentEventRoutes from "./routes/adjustment.routes";
import PackingListRoutes from "./routes/packing-list.routes";
import QuotationRoutes from "./routes/quotation.routes";
import DeliverySlipRoutes from "./routes/delivery-slip.routes";
import GoodReceiptRoutes from "./routes/good-receipt.routes";
import StockRequestRoutes from "./routes/stock-transfer.routes";
import ItemStockRoutes from "./routes/item-stock.routes";

import CashierRoutes from "./routes/cashier.routes";
import MigrationRoutes from "./routes/migration.routes";

import StatusRoutes from "./routes/status.routes";

import AuthInterceptor from "./interceptors/auth.interceptor";
import helmet from "helmet";
import { createClient } from "redis";
import LoggerHelper from "./utils/logger.utils";
import { LoggerType } from "./interfaces/logger.interface";

import cors from "cors";
import InvoiceRoutes from "./routes/invoice.routes";

export const app = express();

export const redisClient = createClient();

const allowedOrigins = ["http://localhost:4200", "https://app.cstyle.cloud"];

const options: cors.CorsOptions = {
  origin: allowedOrigins,
};

app.use(cors(options));

app.use("/upload", express.static(path.join(__dirname, "upload")));

app.use(express.json());
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

app.use("/adjustment", AuthInterceptor.intercept, AdjustmentEventRoutes);
app.use("/cashier", CashierRoutes);
app.use("/migration", MigrationRoutes);

app.use("/status", AuthInterceptor.intercept, StatusRoutes);

redisClient.on("error", (error) => {
  new LoggerHelper({
    type: LoggerType.error,
    message: error,
    tag: "Redis",
  }).log();
});
