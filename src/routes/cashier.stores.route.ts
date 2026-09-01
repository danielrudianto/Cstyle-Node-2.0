import { Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import { param } from "express-validator";
import { ErrorList } from "../constants/error-list.constant";
import ErrorInterceptor from "../interceptors/error.interceptor";

import StoreController from "../controllers/store.controller";
import { StoreRepository } from "../repositories/store.repository";
import { conn } from "../utils/database.helper";
import { cashierController } from "./cashier.container";

const router = Router();

const storeController = new StoreController(new StoreRepository(conn));


router.get("/", AuthInterceptor.anyIntercept, storeController.fetchOthers);

router.get(
  "/:storeCode",
  param("storeCode").isAlphanumeric().withMessage(ErrorList["UID_INVALID"]),
  param("storeCode")
    .isLength({ min: 32, max: 32 })
    .withMessage(ErrorList["UID_INVALID"]),
  ErrorInterceptor.intercept,
  cashierController.checkStore
);

export default router;
