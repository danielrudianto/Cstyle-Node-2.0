import { NextFunction, Request, Response, Router } from "express";
import StockRequestController from "../controllers/stock-request.controller";
import AuthInterceptor from "../interceptors/auth.interceptor";
import { StockRequestRepository } from "../repositories/stock-request.repository";
import { StockRepository } from "../repositories/stock.repository";
import {
  confirmStockRequestSchema,
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

/**
 * Transfer stok dari sisi perangkat kasir.
 *
 * Bedanya dengan routes/stock-request.route.ts: di sini toko tidak dikirim
 * dalam badan permintaan, melainkan disimpulkan dari header "store" oleh
 * anyIntercept. Middleware kecil di bawah menyalin storeID hasil interceptor
 * ke bidang yang dibaca controller.
 *
 * PERHATIKAN ARAHNYA — mudah tertukar:
 *   /unsent    -> requestTo   = toko ini (barang diminta DARI sini)
 *   /unreceived-> requestFrom = toko ini (barang menuju ke sini)
 */

/** Menyalin storeID hasil interceptor ke bidang yang dibaca controller. */
const asStore = (field: "requestTo" | "requestFrom") => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body[field] = req.body.storeID;
    req.body.page = !req.query.page ? 1 : parseInt(req.query.page as string);
    next();
  };
};

/**
 * Perangkat kasir menandai dirinya dengan kode pegawai, bukan userID. Jadi
 * identitas pemanggil disalin dari employeeID hasil interceptor.
 *
 * CATATAN: kalau header "employee-code" tidak dikirim, employeeID bernilai
 * undefined dan dokumennya tercatat tanpa penanggung jawab.
 */
const asEmployee = (req: Request, res: Response, next: NextFunction) => {
  req.body.userID = req.body.employeeID;
  next();
};

router.get(
  "/unsent",
  AuthInterceptor.anyIntercept,
  asStore("requestTo"),
  stockRequestController.fetchUnsentRequests
);

router.get(
  "/unreceived",
  AuthInterceptor.anyIntercept,
  asStore("requestFrom"),
  stockRequestController.fetchUnreceivedRequests
);

router.get(
  "/created",
  AuthInterceptor.anyIntercept,
  asStore("requestFrom"),
  stockRequestController.fetchCreatedRequests
);

router.post(
  "/send",
  AuthInterceptor.anyIntercept,
  validate(sendStockRequestSchema),
  asEmployee,
  stockRequestController.send
);

/*
  Rantai lama di sini mendeklarasikan body("id").isMongoId() TAPI tidak pernah
  memasang ErrorInterceptor sesudahnya, jadi hasil pemeriksaannya tidak pernah
  dibaca. validate() menyatukan keduanya, sehingga sekarang benar-benar berlaku.
*/
router.post(
  "/receive",
  AuthInterceptor.anyIntercept,
  validate(confirmStockRequestSchema),
  asEmployee,
  stockRequestController.receive
);

router.post(
  "/reject",
  AuthInterceptor.anyIntercept,
  validate(rejectStockRequestSchema),
  asEmployee,
  stockRequestController.reject
);

router.post(
  "/",
  AuthInterceptor.anyIntercept,
  stockRequestController.create
);

/* "/:id" harus tetap TERAKHIR. */
router.get(
  "/:id",
  AuthInterceptor.anyIntercept,
  validate(paramStockRequestSchema, "params"),
  stockRequestController.fetchByID
);

export default router;
