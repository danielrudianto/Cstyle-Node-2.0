import { Router } from "express";
import GoodReceiptController from "../controllers/good-receipt.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { GoodReceiptRepository } from "../repositories/good-receipt.repository";
import { StockRepository } from "../repositories/stock.repository";
import {
  createGoodReceiptSchema,
  paramGoodReceiptSchema,
  updateGoodReceiptSchema,
} from "../schemas/good-receipt.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const goodReceiptController = new GoodReceiptController(
  new GoodReceiptRepository(conn),
  new StockRepository(conn)
);

/*
  Seluruh route di sini butuh administrator — wajar, karena ini satu-satunya
  pintu masuk barang dan setiap perubahannya menggeser harga pokok.
*/

/* "/search" harus tetap SEBELUM "/:id". */
router.post(
  "/search",
  AccessInterceptor.administratorRequired,
  goodReceiptController.fetch
);

router.post(
  "/",
  AccessInterceptor.administratorRequired,
  validate(createGoodReceiptSchema),
  goodReceiptController.create
);

router.get(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramGoodReceiptSchema, "params"),
  goodReceiptController.fetchByID
);

router.put(
  "/",
  AccessInterceptor.administratorRequired,
  validate(updateGoodReceiptSchema),
  goodReceiptController.updateByID
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramGoodReceiptSchema, "params"),
  goodReceiptController.deleteByID
);

export default router;
