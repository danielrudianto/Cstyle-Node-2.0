import { NextFunction, Request, Router } from "express";
import { body, header } from "express-validator";
import AuthInterceptor from "../interceptors/auth.interceptor";
import AuthController from "../controllers/auth.controller";
import ErrorInterceptor from "../interceptors/error.interceptor";
import { ErrorList } from "../data/error-list";

const router = Router();

router.post(
  "/refresh-token",
  header("x-token")
    .notEmpty()
    .withMessage(ErrorList["REFRESH_TOKEN_NOT_FOUND"]),
  ErrorInterceptor.intercept,
  ErrorInterceptor.authIntercept,
  AuthController.refreshToken
);

router.post(
  "/update-password",
  body("oldPassword").exists().withMessage(ErrorList["OLD_PASSWORD_REQUIRED"]),
  body("newPassword").exists().withMessage(ErrorList["NEW_PASSWORD_REQUIRED"]),
  ErrorInterceptor.intercept,
  AuthInterceptor.intercept,
  AuthController.updatePassword
);

router.post(
  "/",
  body("username").notEmpty().withMessage(ErrorList["USERNAME_REQUIRED"]),
  body("password").notEmpty().withMessage(ErrorList["PASSWORD_REQUIRED"]),
  ErrorInterceptor.intercept,
  AuthController.login
);

router.get("/", AuthInterceptor.intercept, AuthController.fetchProfile);

export default router;
