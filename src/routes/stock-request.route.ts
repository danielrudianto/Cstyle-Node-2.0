import { Router } from "express";
import StockRequestController from "../controllers/stock-request.controller";
import { StockRequestRepository } from "../repositories/stock-request.repository";
import { StockRepository } from "../repositories/stock.repository";
import {
  confirmStockRequestSchema,
  fetchUnreceivedSchema,
  fetchUnsentSchema,
  paramStockRequestSchema,
  rejectStockRequestSchema,
  sendStockRequestSchema,
} from "../schemas/stock-request.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const stockRequestController = new StockRequestController(
  new StockRequestRepository(conn),
  new StockRepository(conn)
);

/*
  ALAMATNYA "/stock-transfer", NAMA DOMAINNYA "stock-request".

  Berkas dan koleksinya memakai "stock-request", tapi alamat URL-nya sudah
  lama "/stock-transfer" dan dipanggil aplikasi kantor maupun kasir. Alamatnya
  TIDAK diubah — mengubahnya memutus kedua klien.

  Seluruh route di sini juga TANPA pemeriksaan hak akses, sama seperti
  sebelumnya. Autentikasinya hanya dari AuthInterceptor di app.ts.
*/

/* Semua alamat tetap harus SEBELUM "/:id". */
router.post(
  "/unreceived",
  validate(fetchUnreceivedSchema),
  stockRequestController.fetchUnreceivedRequests
);

router.post(
  "/unsent",
  validate(fetchUnsentSchema),
  stockRequestController.fetchUnsentRequests
);

router.post(
  "/send",
  validate(sendStockRequestSchema),
  stockRequestController.send
);

router.post(
  "/confirm",
  validate(confirmStockRequestSchema),
  stockRequestController.checkStatus,
  stockRequestController.confirm
);

router.post(
  "/reject",
  validate(rejectStockRequestSchema),
  stockRequestController.checkStatus,
  stockRequestController.reject
);

router.post("/search/v2", stockRequestController.search);
router.post("/", stockRequestController.create);

/*
  DIHAPUS: POST /stock-transfer/incomplete.

  Route itu menunjuk fetchIncompleteRequests(), yang seluruh isinya
  dikomentari — jadi ia tidak pernah membalas apa pun dan permintaannya
  menggantung sampai klien menyerah. Membiarkan route yang pasti menggantung
  lebih buruk daripada 404 yang jelas, jadi route dan metodenya dibuang.
  Riwayatnya masih ada di git kalau fiturnya mau dilanjutkan.
*/

router.get(
  "/:id",
  validate(paramStockRequestSchema, "params"),
  stockRequestController.fetchByID
);

router.delete(
  "/:id",
  validate(paramStockRequestSchema, "params"),
  stockRequestController.deleteByID
);

export default router;
