import { Router } from "express";
import AuthInterceptor from "../../interceptors/auth.interceptor";
import { body, param } from "express-validator";
import { ErrorList } from "../../data/error-list";
import ErrorInterceptor from "../../interceptors/error.interceptor";
import MembershipController from "../../controllers/membership.controller";

const router = Router();

router.post(
  "/",
  AuthInterceptor.anyIntercept,
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("code").notEmpty().withMessage(ErrorList["CODE_REQUIRED"]),
  body("language").notEmpty().withMessage(ErrorList["LANGUAGE_REQUIRED"]),
  body("language")
    .isIn(["EN", "ID"])
    .withMessage(ErrorList["LANGUAGE_INVALID"]),
  body("phoneNumber").custom((value, { req }) => {
    if (!value && !req.body.email) {
      throw new Error(ErrorList["PHONE_EMAIL_REQUIRED"]);
    }
    return true;
  }),
  ErrorInterceptor.intercept,
  MembershipController.create
);

router.get(
  "/code/:membershipCode",
  AuthInterceptor.anyIntercept,
  param("membershipCode")
    .isAlphanumeric()
    .withMessage(ErrorList["UID_INVALID"]),
  ErrorInterceptor.intercept,
  MembershipController.fetchByCode
);

export default router;
