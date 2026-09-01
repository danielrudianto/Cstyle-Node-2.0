import { Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";

import { cashierController } from "./cashier.container";

import billCashierRoutes from "./cashier.bill.route";
import membershipCashierRoutes from "./cashier.membership.route";
import productCashierRoutes from "./cashier.product.route";
import stockTransferRoutes from "./cashier.stock-transfer.route";
import storeRoutes from "./cashier.stores.route";

/**
 * Pintu masuk seluruh permintaan dari aplikasi kasir (Flutter).
 *
 * BERBEDA DARI ROUTE LAIN, DAN INI PENTING.
 *
 * app.ts memasang "/cashier" TANPA AuthInterceptor — satu-satunya kelompok
 * route yang begitu. Alasannya, perangkat kasir tidak selalu punya token: ia
 * bekerja luring dan hanya membawa kode toko di SharedPreference. Karena itu
 * tiap route di bawah memasang sendiri AuthInterceptor.anyIntercept, yang
 * menerima DUA cara masuk:
 *
 *   1. Header "Authorization" berisi token JWT — dipakai aplikasi kantor.
 *   2. Header "store" berisi kode toko, opsional ditambah "employee-code" —
 *      dipakai perangkat kasir.
 *
 * KONSEKUENSINYA: route yang LUPA memasang anyIntercept menjadi terbuka
 * sepenuhnya. Saat ini itu terjadi pada GET /cashier/membership — lihat
 * catatan di cashier.membership.route.ts.
 *
 * Juga perlu diingat: pada jalur token, anyIntercept TIDAK mengisi
 * req.body.storeID, sehingga nilainya datang apa adanya dari badan permintaan
 * dan pemanggil bebas menentukan toko mana yang ingin dilihat.
 */
const router = Router();

router.use("/stores", storeRoutes);
router.use("/stock-transfer", stockTransferRoutes);
router.use("/products", productCashierRoutes);
router.use("/membership", membershipCashierRoutes);
router.use("/bills", billCashierRoutes);

router.get("/stats", AuthInterceptor.anyIntercept, cashierController.stats);

router.get(
  "/report",
  AuthInterceptor.anyIntercept,
  cashierController.fetchReport
);

/*
  Endpoint tersibuk di sistem ini: perangkat kasir mengirim nota yang terkumpul
  selama luring, setiap 30 detik, selamanya. Lihat catatan bentrok nomor nota
  di bill.repository.ts.
*/
router.post("/sync", AuthInterceptor.anyIntercept, cashierController.sync);

export default router;
