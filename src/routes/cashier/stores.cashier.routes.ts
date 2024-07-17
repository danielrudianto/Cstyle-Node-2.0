import { Router } from "express";
import AuthInterceptor from "../../interceptors/auth.interceptor";
import StoreController from "../../controllers/store.controller";
import { param } from "express-validator";
import { ErrorList } from "../../data/error-list";
import ErrorInterceptor from "../../interceptors/error.interceptor";
import CashierController from "../../controllers/cashier.controller";

const router = Router();

router.get("/", AuthInterceptor.anyIntercept, StoreController.fetchOthers);

router.get(
  "/:storeCode",
  param("storeCode").isAlphanumeric().withMessage(ErrorList["UID_INVALID"]),
  param("storeCode")
    .isLength({ min: 32, max: 32 })
    .withMessage(ErrorList["UID_INVALID"]),
  ErrorInterceptor.intercept,
  CashierController.checkStore
);

export default router;
