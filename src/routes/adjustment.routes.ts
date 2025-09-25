import { Router } from "express";
import AdjustmentEventController from "../controllers/adjustment-event.controller";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import AccessInterceptor from "../interceptors/access.interceptor";

const router = Router();

router.post(
  "/search/v2",
  AccessInterceptor.supervisorRequired,
  AdjustmentEventController.fetch
);

router.post(
  "/",
  AccessInterceptor.supervisorRequired,
  body("date").notEmpty().withMessage(ErrorList["DATE_REQUIRED"]),
  body("items").notEmpty().withMessage(ErrorList["ITEMS_REQUIRED"]),
  body("items").isArray().withMessage(ErrorList["ITEMS_REQUIRED"]),
  body("store").exists().withMessage(ErrorList["STORE_ID_REQUIRED"]),
  ErrorInterceptor.intercept,
  AdjustmentEventController.create
);
router.get(
  "/:id",
  AccessInterceptor.supervisorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  AdjustmentEventController.fetchByID
);

router.delete(
  "/:id",
  AccessInterceptor.supervisorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  AdjustmentEventController.deleteByID
);

export default router;
