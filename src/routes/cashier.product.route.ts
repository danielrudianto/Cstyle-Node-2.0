import { Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import {
  cashierController,
  itemController,
  itemStockController,
} from "./cashier.container";

const router = Router();

router.get("/stock", AuthInterceptor.anyIntercept, cashierController.fetchStock);

router.post(
  "/download",
  AuthInterceptor.anyIntercept,
  itemController.downloadForCashier
);

router.post(
  "/stock",
  AuthInterceptor.anyIntercept,
  cashierController.checkStock
);

router.post(
  "/",
  AuthInterceptor.anyIntercept,
  itemStockController.fetchStockByStoreID
);

export default router;
