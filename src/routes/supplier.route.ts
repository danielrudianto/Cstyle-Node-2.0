import { Router } from "express";
import SupplierController from "../controllers/supplier.controller";
import { SupplierRepository } from "../repositories/supplier.repository";
import {
  createSupplierSchema,
  paramSupplierSchema,
  updateSupplierSchema,
} from "../schemas/supplier.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const supplierController = new SupplierController(
  new SupplierRepository(conn)
);

/*
  Seluruh route di sini sengaja TANPA pemeriksaan hak akses, sama seperti
  sebelumnya — autentikasi hanya datang dari AuthInterceptor yang dipasang di
  app.ts. Artinya setiap pengguna yang sudah masuk, apa pun tingkatannya, bisa
  membuat dan menghapus pemasok.
*/
router.post("/", validate(createSupplierSchema), supplierController.create);
router.put("/", validate(updateSupplierSchema), supplierController.update);

/* "/autocomplete" harus tetap SEBELUM "/:id". */
router.get("/autocomplete", supplierController.fetchAutocomplete);

router.get(
  "/:id",
  validate(paramSupplierSchema, "params"),
  supplierController.fetchByID
);

router.get("/", supplierController.fetch);

router.delete(
  "/:id",
  validate(paramSupplierSchema, "params"),
  supplierController.delete
);

export default router;
