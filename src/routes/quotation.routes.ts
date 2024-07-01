import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import QuotationController from "../controllers/quotation.controller";
import ErrorInterceptor from "../interceptors/error.interceptor";

const router = Router();

router.post("/search/v2", QuotationController.searchV2);
router.post(
  "/",
  body("customer_id").notEmpty().withMessage(ErrorList["CUSTOMER_REQUIRED"]),
  body("items").notEmpty().withMessage(ErrorList["ITEM_REQUIRED"]),
  body("note").exists().withMessage(ErrorList["NOTE_REQUIRED"]),
  body("date").notEmpty().withMessage(ErrorList["DATE_REQUIRED"]),
  ErrorInterceptor.intercept,
  QuotationController.create
);
router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  QuotationController.fetchByID
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  QuotationController.delete
);

export default router;
