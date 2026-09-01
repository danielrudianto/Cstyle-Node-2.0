import { Router } from "express";
import QuotationController from "../controllers/quotation.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { QuotationRepository } from "../repositories/quotation.repository";
import {
  createQuotationSchema,
  paramQuotationSchema,
} from "../schemas/quotation.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const quotationController = new QuotationController(
  new QuotationRepository(conn)
);

/* "/search/v2" harus tetap SEBELUM "/:id". */
router.post(
  "/search/v2",
  AccessInterceptor.salesRequired,
  quotationController.search
);

router.post(
  "/",
  AccessInterceptor.salesRequired,
  validate(createQuotationSchema),
  quotationController.create
);

router.get(
  "/:id",
  AccessInterceptor.salesRequired,
  validate(paramQuotationSchema, "params"),
  quotationController.fetchByID
);

router.delete(
  "/:id",
  AccessInterceptor.salesRequired,
  validate(paramQuotationSchema, "params"),
  quotationController.delete
);

export default router;
