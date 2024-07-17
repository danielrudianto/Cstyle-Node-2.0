import { NextFunction, Request, Response, Router } from "express";
import AuthInterceptor from "../../interceptors/auth.interceptor";
import StockRequestController from "../../controllers/stock-request.controller";
import { body, param } from "express-validator";
import { ErrorList } from "../../data/error-list";
import ErrorInterceptor from "../../interceptors/error.interceptor";

const router = Router();

router.get(
  "/unsent",
  AuthInterceptor.anyIntercept,
  (req: Request, res: Response, next: NextFunction) => {
    req.body.requestTo = req.body.storeID;
    req.body.page = !req.query.page ? 1 : parseInt(req.query.page as string);
    next();
  },
  StockRequestController.fetchUnsentRequests
);

router.get(
  "/unreceived",
  AuthInterceptor.anyIntercept,
  (req: Request, res: Response, next: NextFunction) => {
    req.body.requestFrom = req.body.storeID;
    req.body.page = !req.query.page ? 1 : parseInt(req.query.page as string);
    next();
  },
  StockRequestController.fetchUnreceivedRequests
);

router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  AuthInterceptor.anyIntercept,
  StockRequestController.fetchByID
);

router.post("/", AuthInterceptor.anyIntercept, StockRequestController.create);

router.post(
  "/send",
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  AuthInterceptor.anyIntercept,
  (req: Request, res: Response, next: NextFunction) => {
    req.body.userID = req.body.employeeID;
    next();
  },
  StockRequestController.send
);

router.post(
  "/receive",
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  AuthInterceptor.anyIntercept,
  (req: Request, res: Response, next: NextFunction) => {
    req.body.userID = req.body.employeeID;
    next();
  },
  StockRequestController.receive
);

export default router;
