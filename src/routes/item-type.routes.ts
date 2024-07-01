import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import ItemTypeController from "../controllers/item-type.controller";

const router = Router();

router.post(
  "/",
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("description").notEmpty().withMessage(ErrorList["DESCRIPTION_REQUIRED"]),
  ErrorInterceptor.intercept,
  ItemTypeController.create
);
router.put(
  "/",
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("description").notEmpty().withMessage(ErrorList["DESCRIPTION_REQUIRED"]),
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  ErrorInterceptor.intercept,
  ItemTypeController.update
);

// DO NOT DELETE THIS ROUTE
router.get("/autocomplete", ItemTypeController.fetchAutocomplete);
// DO NOT DELETE THIS ROUTE
router.get("/v2", ItemTypeController.fetchV2);
// DO NOT DELETE THIS ROUTE
router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemTypeController.fetchByID
);

// DO NOT DELETE THIS ROUTE
router.delete(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemTypeController.delete
);

export default router;
