import { Router } from "express";
import DeliverySlipController from "../controllers/delivery-slip.controller";
import { DeliverySlipRepository } from "../repositories/delivery-slip.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { StockRepository } from "../repositories/stock.repository";
import { conn } from "../utils/database.helper";

const router = Router();

const deliverySlipController = new DeliverySlipController(
  new DeliverySlipRepository(conn),
  new InvoiceRepository(conn),
  new StockRepository(conn)
);

/*
  Seluruh route di sini TANPA pemeriksaan hak akses dan TANPA validasi apa pun,
  sama seperti sebelumnya — hanya autentikasi dari app.ts. Berbeda dari
  packing list dan faktur, yang keduanya memasang AccessInterceptor.
*/

/* "/search/v2", "/unconfirmed", dan "/invoice/:id" harus SEBELUM "/:id". */
router.post("/search/v2", deliverySlipController.fetch);
router.post("/", deliverySlipController.create);
router.get("/unconfirmed", deliverySlipController.fetchUnconfirmed);
router.get("/invoice/:id", deliverySlipController.fetchByIDWInvoice);
router.get("/:id", deliverySlipController.fetchByID);
router.put("/confirm", deliverySlipController.confirm);

export default router;
