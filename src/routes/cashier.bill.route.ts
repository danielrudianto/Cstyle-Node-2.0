import { Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import { param } from "express-validator";
import { ErrorList } from "../constants/error-list.constant";
import ErrorInterceptor from "../interceptors/error.interceptor";

import { cashierController } from "./cashier.container";

const router = Router();


router.get("/", AuthInterceptor.anyIntercept, cashierController.fetchBill);
router.get(
  "/:id",
  AuthInterceptor.anyIntercept,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  cashierController.fetchBillByID
);

export default router;
