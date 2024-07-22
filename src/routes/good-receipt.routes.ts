import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import GoodReceiptController from "../controllers/good-receipt.controller";
import AccessInterceptor from "../interceptors/access.interceptor";

const router = Router();

router.post(
  "/search",
  AccessInterceptor.administratorRequired,
  GoodReceiptController.fetch
);
router.post(
  "/",
  // AccessInterceptor.administratorRequired,
  body("supplier").notEmpty().withMessage(ErrorList["SUPPLIER_REQUIRED"]),
  body("date").notEmpty().withMessage(ErrorList["DATE_REQUIRED"]),
  body("items").notEmpty().withMessage(ErrorList["ITEMS_REQUIRED"]),
  body("items").isArray().withMessage(ErrorList["ITEMS_REQUIRED"]),
  ErrorInterceptor.intercept,
  GoodReceiptController.create
);

router.get(
  "/:id",
  AccessInterceptor.administratorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  GoodReceiptController.fetchByID
);

router.put(
  "/",
  AccessInterceptor.administratorRequired,
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("supplier").notEmpty().withMessage(ErrorList["SUPPLIER_REQUIRED"]),
  body("date").notEmpty().withMessage(ErrorList["DATE_REQUIRED"]),
  ErrorInterceptor.intercept,
  GoodReceiptController.updateByID
);

export default router;
