import { Router } from "express";
import { ErrorList } from "../data/error-list";
import { body, param } from "express-validator";
import ErrorInterceptor from "../interceptors/error.interceptor";
import SupplierController from "../controllers/supplier.controller";
import AuthInterceptor from "../interceptors/auth.interceptor";

const router = Router();

router.post(
  "/",
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("address").notEmpty().withMessage(ErrorList["ADDRESS_REQUIRED"]),
  body("phone").notEmpty().withMessage(ErrorList["PHONE_NUMBER_REQUIRED"]),
  ErrorInterceptor.intercept,
  SupplierController.create
);

router.put(
  "/",
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("address").notEmpty().withMessage(ErrorList["ADDRESS_REQUIRED"]),
  body("phone").notEmpty().withMessage(ErrorList["PHONE_NUMBER_REQUIRED"]),
  ErrorInterceptor.intercept,
  SupplierController.update
);

router.get("/autocomplete", SupplierController.fetchAutocomplete);
router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  SupplierController.fetchByID
);
router.get("/", SupplierController.fetch);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  SupplierController.delete
);

export default router;
