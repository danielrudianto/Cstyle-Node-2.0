import { Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import { body, param } from "express-validator";
import ErrorInterceptor from "../interceptors/error.interceptor";
import { ErrorList } from "../data/error-list";
import StoreController from "../controllers/store.controller";
import AccessInterceptor from "../interceptors/access.interceptor";

const router = Router();

router.post(
  "/",
  AccessInterceptor.administratorRequired,
  body("name").notEmpty().withMessage(ErrorList["STORE_NAME_REQUIRED"]),
  body("prefix").notEmpty().withMessage(ErrorList["STORE_PREFIX_REQUIRED"]),
  body("phoneNumber")
    .notEmpty()
    .withMessage(ErrorList["STORE_PHONE_NUMBER_REQUIRED"]),
  body("address").notEmpty().withMessage(ErrorList["STORE_ADDRESS_REQUIRED"]),
  body("code").notEmpty().withMessage(ErrorList["CODE_REQUIRED"]),
  ErrorInterceptor.intercept,
  StoreController.create
);

router.get("/autocomplete", StoreController.fetchAutocomplete);
router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  StoreController.fetchByID
);
router.get("/", StoreController.fetch);

router.put(
  "/",
  AccessInterceptor.administratorRequired,
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  body("name").notEmpty().withMessage(ErrorList["STORE_NAME_REQUIRED"]),
  body("prefix").notEmpty().withMessage(ErrorList["STORE_PREFIX_REQUIRED"]),
  body("phoneNumber")
    .notEmpty()
    .withMessage(ErrorList["STORE_PHONE_NUMBER_REQUIRED"]),
  body("address").notEmpty().withMessage(ErrorList["STORE_ADDRESS_REQUIRED"]),
  ErrorInterceptor.intercept,
  StoreController.updateByID
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  StoreController.deleteByID
);

export default router;
