import { Router } from "express";
import BillController from "../controllers/bill.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import AuthInterceptor from "../interceptors/auth.interceptor";
import { BillRepository } from "../repositories/bill.repository";
import { StockRepository } from "../repositories/stock.repository";
import { paramBillSchema } from "../schemas/bill.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const billController = new BillController(
  new BillRepository(conn),
  new StockRepository(conn)
);

/*
  AuthInterceptor dipasang lagi di sini meskipun app.ts sudah memasangnya untuk
  seluruh "/bill". Itu bawaan kode lama dan dibiarkan: memasangnya dua kali
  tidak berbahaya, hanya satu pemeriksaan token yang terulang.
*/
router.post("/", AuthInterceptor.intercept, billController.fetch);

router.get(
  "/:id",
  AuthInterceptor.intercept,
  validate(paramBillSchema, "params"),
  billController.fetchByID
);

/*
  Sengaja TANPA pemeriksaan bentuk id, berbeda dari GET di atas — mengikuti
  rantai lama.
*/
router.delete(
  "/:id",
  AuthInterceptor.intercept,
  AccessInterceptor.administratorRequired,
  billController.deleteByID
);

export default router;
