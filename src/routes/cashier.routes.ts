import { Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import CashierController from "../controllers/cashier.controller";

import storeRoutes from "./cashier/stores.cashier.routes";
import stockTransferRoutes from "./cashier/stock-transfer.cashier.routes";
import productCashierRoutes from "./cashier/product.cashier.routes";
import membershipCashierRoutes from "./cashier/membership.cashier.routes";

const router = Router();

router.use("/stores", storeRoutes);
router.use("/stock-transfer", stockTransferRoutes);
router.use("/products", productCashierRoutes);
router.use("/membership", membershipCashierRoutes);

router.get("/stats", AuthInterceptor.anyIntercept, CashierController.stats);
router.get(
  "/report",
  AuthInterceptor.anyIntercept,
  CashierController.fetchReport
);
router.post("/sync", AuthInterceptor.anyIntercept, CashierController.sync);

export default router;
