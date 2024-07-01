import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import AuthInterceptor from "../interceptors/auth.interceptor";
import ErrorInterceptor from "../interceptors/error.interceptor";
import ItemBrandController from "../controllers/item-brand.controller";

const router = Router();

router.post(
  "/",
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  ErrorInterceptor.intercept,
  ItemBrandController.create
);
router.put(
  "/",
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemBrandController.update
);
router.get("/autocomplete", ItemBrandController.fetchAutocomplete);
router.get("/v2", ItemBrandController.fetchV2);
router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemBrandController.fetchByID
);
router.delete(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  AuthInterceptor.administratorInterceptor,
  ItemBrandController.delete
);

export default router;
