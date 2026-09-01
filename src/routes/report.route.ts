import { Router } from "express";
import ReportController from "../controllers/report.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { BillRepository } from "../repositories/bill.repository";
import { GoodReceiptRepository } from "../repositories/good-receipt.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { StockOutRepository } from "../repositories/stock-out.repository";
import { updateSalesReportSchema } from "../schemas/report.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const reportController = new ReportController(
  new BillRepository(conn),
  new InvoiceRepository(conn),
  new GoodReceiptRepository(conn),
  new StockOutRepository(conn)
);

/*
  Dua laporan penjualan di bawah TIDAK memakai AccessInterceptor. Pemeriksaan
  haknya dikerjakan di dalam controller, dengan membaca accessLevel dari cache
  Redis dan hanya mengizinkan tingkat 0 dan 4. Bentuk itu dipertahankan, tapi
  perlu diingat: pemeriksaan hak yang tersebar di dua tempat berbeda mudah
  terlewat saat menambah route baru.
*/
router.post("/sales", reportController.fetchSalesReport);
router.post("/sales-product", reportController.fetchSalesProductReport);

router.post(
  "/purchase",
  AccessInterceptor.administratorRequired,
  reportController.fetchPurchaseReport
);

router.post(
  "/purchase-product",
  AccessInterceptor.administratorRequired,
  reportController.fetchPurchaseProductReport
);

/* Menyembunyikan atau memunculkan kembali nota dan faktur pada laporan. */
router.put(
  "/sales",
  AccessInterceptor.administratorRequired,
  validate(updateSalesReportSchema),
  reportController.updateSalesReport
);

export default router;
