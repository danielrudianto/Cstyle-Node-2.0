import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import ItemBrandController from "../controllers/item-brand.controller";
import AccessInterceptor from "../interceptors/access.interceptor";

const router = Router();

router.post(
  "/",
  AccessInterceptor.administratorRequired,
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  ErrorInterceptor.intercept,
  ItemBrandController.create
);
router.put(
  "/",
  AccessInterceptor.administratorRequired,
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemBrandController.update
);
router.get(
  "/autocomplete",
  AccessInterceptor.administratorRequired,
  ItemBrandController.fetchAutocomplete
);
router.get("/v2", ItemBrandController.fetchV2);

router.get(
  "/:id",
  AccessInterceptor.administratorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemBrandController.fetchByID
);
router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemBrandController.delete
);

export default router;
