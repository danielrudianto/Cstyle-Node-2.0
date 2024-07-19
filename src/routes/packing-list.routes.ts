import { Router } from "express";
import PackingListController from "../controllers/packing-list.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";

const router = Router();

router.post(
  "/search/v2",
  AccessInterceptor.salesRequired,
  PackingListController.fetch
);
router.post(
  "/",
  AccessInterceptor.salesRequired,
  body("date").notEmpty().withMessage(ErrorList["DATE_REQUIRED"]),
  body("dueDate").notEmpty().withMessage(ErrorList["DUE_DATE_REQUIRED"]),
  body("note").exists().withMessage(ErrorList["NOTE_REQUIRED"]),
  body("invoiceNote").exists().withMessage(ErrorList["INVOICE_NOTE_REQUIRED"]),
  body("salesID").exists().withMessage(ErrorList["SALES_REQUIRED"]),
  body("customerID").notEmpty().withMessage(ErrorList["CUSTOMER_REQUIRED"]),
  body("items").isArray().withMessage(ErrorList["ITEMS_REQUIRED"]),
  body("items.*.itemID").notEmpty().withMessage(ErrorList["ITEM_REQUIRED"]),
  body("items.*.quantity")
    .notEmpty()
    .withMessage(ErrorList["QUANTITY_REQUIRED"]),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage(ErrorList["QUANTITY_INVALID"]),
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage(ErrorList["PRICE_INVALID"]),
  ErrorInterceptor.intercept,
  PackingListController.create
);
router.get(
  "/:id",
  AccessInterceptor.salesRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  PackingListController.fetchByID
);

export default router;
