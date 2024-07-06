import { Router } from "express";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";
import CustomerController from "../controllers/customer.controller";

const router = Router();

router.post(
  "/",
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("address").notEmpty().withMessage(ErrorList["ADDRESS_REQUIRED"]),
  body("phone").notEmpty().withMessage(ErrorList["PHONE_NUMBER_REQUIRED"]),
  body("type").notEmpty().withMessage(ErrorList["TYPE_REQUIRED"]),
  body("type")
    .toLowerCase()
    .isIn(["bulk", "consignment"])
    .withMessage(ErrorList["CUSTOMER_TYPE_INVALID"]),
  ErrorInterceptor.intercept,
  CustomerController.create
);

router.put(
  "/v2",
  body("id").notEmpty().withMessage(ErrorList["ID_REQUIRED"]),
  body("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  body("name").notEmpty().withMessage(ErrorList["NAME_REQUIRED"]),
  body("address").notEmpty().withMessage(ErrorList["ADDRESS_REQUIRED"]),
  body("phone").notEmpty().withMessage(ErrorList["PHONE_NUMBER_REQUIRED"]),
  body("type").notEmpty().withMessage(ErrorList["TYPE_REQUIRED"]),
  body("type")
    .toLowerCase()
    .isIn(["bulk", "consignment"])
    .withMessage(ErrorList["CUSTOMER_TYPE_INVALID"]),
  ErrorInterceptor.intercept,
  CustomerController.updateV2
);

router.get("/v2", CustomerController.fetchV2);
router.get("/bulk/autocomplete", CustomerController.fetchAutocompleteBulk);
router.get(
  "/consignment/autocomplete",
  CustomerController.fetchAutocompleteConsignment
);
router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  CustomerController.fetchByID
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  CustomerController.deleteByID
);

export default router;
