import { Router } from "express";
import BillController from "../controllers/bill.controller";
import AuthInterceptor from "../interceptors/auth.interceptor";
import { param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import AccessInterceptor from "../interceptors/access.interceptor";

const router = Router();

router.post("/", AuthInterceptor.intercept, BillController.fetch);
router.get(
  "/:id",
  AuthInterceptor.intercept,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  BillController.fetchByID
);

router.delete(
  "/:id",
  AuthInterceptor.intercept,
  AccessInterceptor.administratorRequired,
  BillController.deleteByID
);

export default router;
