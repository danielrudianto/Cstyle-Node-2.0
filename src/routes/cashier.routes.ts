import { Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import CashierController from "../controllers/cashier.controller";
import { ErrorList } from "../data/error-list";
import { param } from "express-validator";
import ErrorInterceptor from "../interceptors/error.interceptor";
import MembershipController from "../controllers/membership.controller";

const router = Router();

router.get(
  "/stock",
  AuthInterceptor.anyIntercept,
  CashierController.fetchStock
);
router.get(
  "/check/:storeCode",
  param("storeCode").isAlphanumeric().withMessage(ErrorList["UID_INVALID"]),
  param("storeCode")
    .isLength({ min: 32, max: 32 })
    .withMessage(ErrorList["UID_INVALID"]),
  ErrorInterceptor.intercept,
  CashierController.checkStore
);
router.get(
  "/membership/code/:membershipCode",
  AuthInterceptor.anyIntercept,
  MembershipController.fetchByCode
);
router.post("/sync", AuthInterceptor.anyIntercept, CashierController.sync);

export default router;
