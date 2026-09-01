import { Router } from "express";
import PackingListController from "../controllers/packing-list.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { PackingListRepository } from "../repositories/packing-list.repository";
import { StockRepository } from "../repositories/stock.repository";
import {
  createPackingListSchema,
  paramPackingListSchema,
} from "../schemas/packing-list.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const packingListController = new PackingListController(
  new PackingListRepository(conn),
  new InvoiceRepository(conn),
  new StockRepository(conn)
);

/* "/search/v2" harus tetap SEBELUM "/:id". */
router.post(
  "/search/v2",
  AccessInterceptor.salesRequired,
  packingListController.fetch
);

router.post(
  "/",
  AccessInterceptor.salesRequired,
  validate(createPackingListSchema),
  packingListController.create
);

router.get(
  "/:id",
  AccessInterceptor.salesRequired,
  validate(paramPackingListSchema, "params"),
  packingListController.fetchByID
);

export default router;
