import { Router } from "express";
import AuthInterceptor from "../../interceptors/auth.interceptor";
import ItemStockController from "../../controllers/item-stock.controller";
import CashierController from "../../controllers/cashier.controller";

const router = Router();

router.get(
  "/stock",
  AuthInterceptor.anyIntercept,
  CashierController.fetchStock
);

router.post(
  "/stock",
  AuthInterceptor.anyIntercept,
  CashierController.checkStock
);

router.post(
  "/",
  AuthInterceptor.anyIntercept,
  ItemStockController.fetchStockByStoreID
);

export default router;
