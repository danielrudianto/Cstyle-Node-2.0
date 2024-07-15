import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import StockRequestController from "../controllers/stock-request.controller";

const router = Router();

router.post(
  "/unreceived",
  body("requestFrom").exists().withMessage(ErrorList["STORE_ID_REQUIRED"]),
  ErrorInterceptor.intercept,
  StockRequestController.fetchUnreceivedRequests
);

router.post(
  "/unsent",
  body("requestTo").exists().withMessage(ErrorList["STORE_ID_REQUIRED"]),
  ErrorInterceptor.intercept,
  StockRequestController.fetchUnsentRequests
);

router.get(
  "/:id",
  param("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  StockRequestController.fetchByID
);

router.post(
  "/send",
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  body("items").notEmpty().withMessage(ErrorList["ITEMS_REQUIRED"]),
  body("items").isArray().withMessage(ErrorList["ITEMS_INVALID"]),
  ErrorInterceptor.intercept,
  StockRequestController.send
);

router.post(
  "/confirm",
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  StockRequestController.checkStatus,
  StockRequestController.confirm
);
router.post(
  "/reject",
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  body("rejectNote").notEmpty().withMessage(ErrorList["REJECT_NOTE_REQUIRED"]),
  ErrorInterceptor.intercept,
  StockRequestController.checkStatus,
  StockRequestController.reject
);
router.post("/incomplete", StockRequestController.fetchIncompleteRequests);
router.post("/search/v2", StockRequestController.searchV2);
router.post("/", StockRequestController.create);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  StockRequestController.deleteByID
);

export default router;
