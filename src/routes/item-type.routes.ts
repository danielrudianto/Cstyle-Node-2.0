import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import ItemTypeController from "../controllers/item-type.controller";
import AccessInterceptor from "../interceptors/access.interceptor";

const router = Router();

router.post(
  "/",
  AccessInterceptor.administratorRequired,
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("description").notEmpty().withMessage(ErrorList["DESCRIPTION_REQUIRED"]),
  ErrorInterceptor.intercept,
  ItemTypeController.create
);
router.put(
  "/",
  AccessInterceptor.administratorRequired,
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("description").notEmpty().withMessage(ErrorList["DESCRIPTION_REQUIRED"]),
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  ErrorInterceptor.intercept,
  ItemTypeController.update
);

router.get("/autocomplete", ItemTypeController.fetchAutocomplete);
router.get("/v2", ItemTypeController.fetchV2);
router.get(
  "/:id",
  AccessInterceptor.administratorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemTypeController.fetchByID
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemTypeController.delete
);

export default router;
