import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import ItemController from "../controllers/item.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import AuthInterceptor from "../interceptors/auth.interceptor";
import { ItemRepository } from "../repositories/item.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import { StockRepository } from "../repositories/stock.repository";
import { StoreRepository } from "../repositories/store.repository";
import {
  fetchItemPriceSchema,
  paramItemSchema,
  updateItemFavoriteSchema,
  updateItemPriceSchema,
} from "../schemas/item.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const itemController = new ItemController(
  new ItemRepository(conn),
  new MigrationRepository(conn),
  new StockRepository(conn),
  new StoreRepository(conn)
);

/**
 * Penyimpanan berkas unggahan.
 *
 * PERINGATAN: nama berkas diambil dari `file.originalname`, yaitu nama yang
 * dikirim klien, dan dipakai apa adanya. Multer memang tidak membersihkannya.
 * Nama yang memuat "../" akan menulis berkas di luar folder "upload". Cacat
 * ini SUDAH ADA dan dipertahankan supaya refactor ini tidak mencampur
 * perubahan perilaku — tapi ia perlu ditutup segera dengan membuat nama
 * berkas sendiri, bukan memakai kiriman klien.
 *
 * Tidak ada fileFilter dan tidak ada batas ukuran, jadi jenis berkas apa pun
 * dengan ukuran berapa pun diterima.
 */
const uploadOptions = multer.diskStorage({
  destination: "upload",
  filename: (req, file, cb) => {
    if (fs.existsSync(path.join("upload", file.originalname))) {
      cb(new Error("File already exists"), file.originalname);
    } else {
      cb(null, file.originalname);
    }
  },
});

const upload = multer({ storage: uploadOptions });

router.post(
  "/price",
  validate(fetchItemPriceSchema),
  itemController.fetchPrice
);

/* Sengaja tanpa pemeriksaan hak akses maupun validasi, sama seperti sebelumnya. */
router.post("/selector/v2", itemController.fetchByBranch);

/*
  URUTAN DI SINI PENTING DAN RAPUH.

  multer mengganti seluruh req.body dengan bidang multipart hasil parse, jadi
  `userID` yang ditulis AuthInterceptor di tingkat app ikut terhapus. Karena
  itu AuthInterceptor dipasang SEKALI LAGI setelah multer, supaya controller
  tetap tahu siapa pemanggilnya.

  Sebaliknya, AccessInterceptor harus berada SEBELUM multer, karena ia membaca
  req.body.userID yang saat itu masih utuh.
*/
router.post(
  "/v2",
  AccessInterceptor.administratorRequired,
  upload.array("images", 8),
  (req, res, next) => {
    req.body.images =
      req.files == undefined
        ? []
        : (req.files as any[]).map((file) => `upload/${file.originalname}`);
    next();
  },
  AuthInterceptor.intercept,
  itemController.create
);

router.put(
  "/like",
  AccessInterceptor.administratorRequired,
  validate(updateItemFavoriteSchema),
  itemController.updateFavoriteStatus
);

router.put(
  "/price",
  AccessInterceptor.administratorRequired,
  validate(updateItemPriceSchema),
  itemController.updatePrice
);

router.put(
  "/v2",
  AccessInterceptor.administratorRequired,
  (req, res, next) => {
    upload.array("images", 8)(req, res, (err) => {
      if (err) {
        return res.status(400).send(err.message);
      }

      req.body.images =
        req.files == undefined || req.files == null
          ? []
          : (req.files as any[]).map((file) => `upload/${file.originalname}`);
      next();
    });
  },
  itemController.update
);

/* "/v2" dan "/download" harus tetap SEBELUM "/:id". */
router.get("/v2", itemController.fetch);
router.get("/download", itemController.download);

router.get(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramItemSchema, "params"),
  itemController.fetchByID
);

router.delete(
  "/image/:id/:name",
  AccessInterceptor.administratorRequired,
  itemController.deleteImage
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramItemSchema, "params"),
  itemController.deleteByID
);

export default router;
