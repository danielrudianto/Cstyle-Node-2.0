import { Router } from "express";
import ReportController from "../controllers/report.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { body } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import bodyParser from "body-parser";

const router = Router();

router.post("/sales", ReportController.fetchSalesReport);
router.post("/sales-product", ReportController.fetchSalesProductReport);

router.post(
  "/purchase",
  AccessInterceptor.administratorRequired,
  ReportController.fetchPurchaseReport
);
router.post(
  "/purchase-product",
  AccessInterceptor.administratorRequired,
  ReportController.fetchPurchaseProductReport
);

router.put(
  "/sales",
  AccessInterceptor.administratorRequired,
  body("invoices")
    .isArray()
    .notEmpty()
    .withMessage(ErrorList["INVOICE_REQUIRED"]),
  body("invoices.*.id")
    .isMongoId()
    .withMessage(ErrorList["INVOICE_ID_REQUIRED"]),
  body("bills").isArray().notEmpty().withMessage(ErrorList["BILL_REQUIRED"]),
  body("bills.*.id").isMongoId().withMessage(ErrorList["BILL_ID_REQUIRED"]),
  ErrorInterceptor.intercept,
  ReportController.updateSalesReport
);

export default router;
