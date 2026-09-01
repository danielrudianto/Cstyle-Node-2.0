import { Router } from "express";
import CustomerController from "../controllers/customer.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { CustomerRepository } from "../repositories/customer.repository";
import {
  createCustomerSchema,
  paramCustomerSchema,
  updateCustomerSchema,
} from "../schemas/customer.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

/**
 * Perakitan untuk domain pelanggan.
 *
 * Repository dan controller dibuat sekali di sini, bukan di app.ts, supaya
 * satu domain cukup dibaca dari satu berkas route saja.
 */
const customerController = new CustomerController(
  new CustomerRepository(conn)
);

router.post(
  "/",
  AccessInterceptor.salesRequired,
  validate(createCustomerSchema),
  customerController.create
);

router.put(
  "/v2",
  AccessInterceptor.salesRequired,
  validate(updateCustomerSchema),
  customerController.update
);

router.get("/v2", AccessInterceptor.salesRequired, customerController.fetch);

/*
  Kedua route autocomplete harus tetap berada SEBELUM "/:id", supaya "bulk"
  dan "consignment" tidak tertangkap sebagai id pelanggan.
*/
router.get(
  "/bulk/autocomplete",
  AccessInterceptor.salesRequired,
  customerController.fetchAutocompleteBulk
);

router.get(
  "/consignment/autocomplete",
  AccessInterceptor.salesRequired,
  customerController.fetchAutocompleteConsignment
);

router.get(
  "/:id",
  AccessInterceptor.salesRequired,
  validate(paramCustomerSchema, "params"),
  customerController.fetchByID
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramCustomerSchema, "params"),
  customerController.deleteByID
);

export default router;
