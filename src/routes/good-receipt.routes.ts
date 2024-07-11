import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import GoodReceiptController from "../controllers/good-receipt.controller";

const router = Router();

router.post("/search", GoodReceiptController.fetch);
router.post(
  "/",
  body("supplier").notEmpty().withMessage(ErrorList["SUPPLIER_REQUIRED"]),
  body("date").notEmpty().withMessage(ErrorList["DATE_REQUIRED"]),
  body("items").notEmpty().withMessage(ErrorList["ITEMS_REQUIRED"]),
  body("items").isArray().withMessage(ErrorList["ITEMS_REQUIRED"]),
  ErrorInterceptor.intercept,
  GoodReceiptController.create
);

router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  GoodReceiptController.fetchByID
);

router.put("/", GoodReceiptController.updateByID);

export default router;
