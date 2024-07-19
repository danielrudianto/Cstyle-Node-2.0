import { Router } from "express";
import InvoiceController from "../controllers/invoice.controller";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import AccessInterceptor from "../interceptors/access.interceptor";

const router = Router();

router.post(
  "/search/v2",
  AccessInterceptor.salesRequired,
  InvoiceController.fetch
);
router.post(
  "/payment",
  AccessInterceptor.salesRequired,
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  body("paidAt").exists().withMessage(ErrorList["DATE_REQUIRED"]),
  body("paymentMethod")
    .exists()
    .withMessage(ErrorList["PAYMENT_METHOD_REQUIRED"]),
  body("paymentMethod")
    .isIn(["cash", "transfer"])
    .withMessage(ErrorList["PAYMENT_METHOD_INVALID"]),
  body("amount").isFloat({ min: 0 }).withMessage(ErrorList["AMOUNT_INVALID"]),
  ErrorInterceptor.intercept,
  InvoiceController.updatePayment
);
router.get(
  "/:id",
  AccessInterceptor.salesRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  InvoiceController.fetchByID
);

router.delete(
  "/payment/:id",
  AccessInterceptor.salesRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  InvoiceController.deletePaymentByID
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  InvoiceController.deleteByID
);

export default router;
