import { Router } from "express";
import InvoiceController from "../controllers/invoice.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { DeliverySlipRepository } from "../repositories/delivery-slip.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { PackingListRepository } from "../repositories/packing-list.repository";
import { StockRepository } from "../repositories/stock.repository";
import {
  paramInvoiceSchema,
  updateInvoicePaymentSchema,
} from "../schemas/invoice.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const invoiceController = new InvoiceController(
  new InvoiceRepository(conn),
  new PackingListRepository(conn),
  new DeliverySlipRepository(conn),
  new StockRepository(conn)
);

/* "/search/v2" dan "/payment" harus tetap SEBELUM "/:id". */
router.post(
  "/search/v2",
  AccessInterceptor.salesRequired,
  invoiceController.fetch
);

router.post(
  "/payment",
  AccessInterceptor.salesRequired,
  validate(updateInvoicePaymentSchema),
  invoiceController.updatePayment
);

router.get(
  "/:id",
  AccessInterceptor.salesRequired,
  validate(paramInvoiceSchema, "params"),
  invoiceController.fetchByID
);

/* "/payment/:id" harus tetap SEBELUM "/:id" pada method DELETE. */
router.delete(
  "/payment/:id",
  AccessInterceptor.salesRequired,
  validate(paramInvoiceSchema, "params"),
  invoiceController.deletePaymentByID
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramInvoiceSchema, "params"),
  invoiceController.deleteByID
);

export default router;
