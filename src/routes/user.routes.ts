import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import AuthInterceptor from "../interceptors/auth.interceptor";
import ErrorInterceptor from "../interceptors/error.interceptor";
import UserController from "../controllers/user.controller";
import AccessInterceptor from "../interceptors/access.interceptor";

const router = Router();

router.post(
  "/reset-password",
  AccessInterceptor.administratorRequired,
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  ErrorInterceptor.intercept,
  UserController.resetPassword
);
router.post(
  "/",
  AccessInterceptor.administratorRequired,
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("username").notEmpty().withMessage(ErrorList["USERNAME_REQUIRED"]),
  body("accessLevel").isInt().withMessage(ErrorList["ACCESS_LEVEL_REQUIRED"]),
  ErrorInterceptor.intercept,
  UserController.create
);

router.get("/sales/autocomplete", UserController.fetchSales);

router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  UserController.fetchByID
);
router.get("/", UserController.fetch);

router.put(
  "/",
  body("id").exists().withMessage(ErrorList["ID_REQUIRED"]),
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("username").notEmpty().withMessage(ErrorList["USERNAME_REQUIRED"]),
  body("accessLevel").isInt().withMessage(ErrorList["ACCESS_LEVEL_REQUIRED"]),
  ErrorInterceptor.intercept,
  UserController.updateByID
);
router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  UserController.deleteByID
);

export default router;
