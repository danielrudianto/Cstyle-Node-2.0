import { Router } from "express";
import InvoiceController from "../controllers/invoice.controller";
import { param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";

const router = Router();

router.post("/search/v2", InvoiceController.fetch);
router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  InvoiceController.fetchByID
);
router.delete(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  InvoiceController.deleteByID
);

export default router;
