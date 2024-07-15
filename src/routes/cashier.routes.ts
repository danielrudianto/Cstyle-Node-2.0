import { NextFunction, Request, Response, Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import CashierController from "../controllers/cashier.controller";
import { ErrorList } from "../data/error-list";
import { body, param } from "express-validator";
import ErrorInterceptor from "../interceptors/error.interceptor";
import MembershipController from "../controllers/membership.controller";
import StoreController from "../controllers/store.controller";
import ItemStockController from "../controllers/item-stock.controller";
import StockRequestController from "../controllers/stock-request.controller";

const router = Router();

router.get(
  "/stores",
  AuthInterceptor.anyIntercept,
  StoreController.fetchOthers
);

router.get(
  "/stock",
  AuthInterceptor.anyIntercept,
  CashierController.fetchStock
);

router.get(
  "/check/:storeCode",
  param("storeCode").isAlphanumeric().withMessage(ErrorList["UID_INVALID"]),
  param("storeCode")
    .isLength({ min: 32, max: 32 })
    .withMessage(ErrorList["UID_INVALID"]),
  ErrorInterceptor.intercept,
  CashierController.checkStore
);

router.get(
  "/membership/code/:membershipCode",
  AuthInterceptor.anyIntercept,
  param("membershipCode")
    .isAlphanumeric()
    .withMessage(ErrorList["UID_INVALID"]),
  ErrorInterceptor.intercept,
  MembershipController.fetchByCode
);

router.get(
  "/stock-transfer/unsent",
  AuthInterceptor.anyIntercept,
  (req: Request, res: Response, next: NextFunction) => {
    req.body.requestTo = req.body.storeID;
    req.body.page = !req.query.page ? 1 : parseInt(req.query.page as string);
    next();
  },
  StockRequestController.fetchUnsentRequests
);

router.get(
  "/stock-transfer/unreceived",
  AuthInterceptor.anyIntercept,
  (req: Request, res: Response, next: NextFunction) => {
    req.body.requestFrom = req.body.storeID;
    req.body.page = !req.query.page ? 1 : parseInt(req.query.page as string);
    next();
  },
  StockRequestController.fetchUnreceivedRequests
);

router.get(
  "/stock-transfer/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  AuthInterceptor.anyIntercept,
  StockRequestController.fetchByID
);

router.post(
  "/membership",
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

router.post(
  "/product",
  AuthInterceptor.anyIntercept,
  ItemStockController.fetchStockByStoreID
);

router.post(
  "/stock-transfer/send",
  AuthInterceptor.anyIntercept,
  StockRequestController.send
);

router.post(
  "/stock-transfer/receive",
  AuthInterceptor.anyIntercept,
  StockRequestController.receive
);

router.post(
  "/stock-transfer",
  AuthInterceptor.anyIntercept,
  StockRequestController.create
);

router.post("/sync", AuthInterceptor.anyIntercept, CashierController.sync);

export default router;
