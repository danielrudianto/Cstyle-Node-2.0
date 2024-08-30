import { Router } from "express";
import AuthInterceptor from "../../interceptors/auth.interceptor";
import CashierController from "../../controllers/cashier.controller";
import { param } from "express-validator";
import { ErrorList } from "../../data/error-list";
import ErrorInterceptor from "../../interceptors/error.interceptor";

const router = Router();

router.get("/", AuthInterceptor.anyIntercept, CashierController.fetchBill);
router.get(
  "/:id",
  AuthInterceptor.anyIntercept,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  CashierController.fetchBillByID
);

export default router;
