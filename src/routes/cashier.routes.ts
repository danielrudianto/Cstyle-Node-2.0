import { NextFunction, Request, Response, Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import CashierController from "../controllers/cashier.controller";
import { ErrorList } from "../data/error-list";
import { body, param } from "express-validator";
import ErrorInterceptor from "../interceptors/error.interceptor";
import MembershipController from "../controllers/membership.controller";
import ItemStockController from "../controllers/item-stock.controller";
import StockRequestController from "../controllers/stock-request.controller";

import storeRoutes from "./cashier/stores.cashier.routes";
import stockTransferRoutes from "./cashier/stock-transfer.cashier.routes";

const router = Router();

router.use("/stores", storeRoutes);
router.use("/stock-transfer", stockTransferRoutes);

router.get(
  "/stock",
  AuthInterceptor.anyIntercept,
  CashierController.fetchStock
);

router.get(
  "/membership/code/:membershipCode",
  AuthInterceptor.anyIntercept,
  param("membershipCode")
    .isAlphanumeric()
    .withMessage(ErrorList["UID_INVALID"]),
  ErrorInterceptor.intercept,
  MembershipController.fetchByCode
);

router.post(
  "/product",
  AuthInterceptor.anyIntercept,
  ItemStockController.fetchStockByStoreID
);

router.post("/sync", AuthInterceptor.anyIntercept, CashierController.sync);

export default router;
