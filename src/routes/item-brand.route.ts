import { Router } from "express";
import ItemBrandController from "../controllers/item-brand.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { ItemBrandRepository } from "../repositories/item-brand.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import {
  createItemBrandSchema,
  paramItemBrandSchema,
  updateItemBrandSchema,
} from "../schemas/item-brand.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const itemBrandController = new ItemBrandController(
  new ItemBrandRepository(conn),
  new MigrationRepository(conn)
);

router.post(
  "/",
  AccessInterceptor.administratorRequired,
  validate(createItemBrandSchema),
  itemBrandController.create
);

router.put(
  "/",
  AccessInterceptor.administratorRequired,
  validate(updateItemBrandSchema),
  itemBrandController.update
);

/*
  "/autocomplete" dan "/v2" harus tetap SEBELUM "/:id", supaya keduanya tidak
  tertangkap sebagai id merek.
*/
router.get(
  "/autocomplete",
  AccessInterceptor.administratorRequired,
  itemBrandController.fetchAutocomplete
);

/* Sengaja tanpa pemeriksaan hak akses, sama seperti sebelumnya. */
router.get("/v2", itemBrandController.fetch);

router.get(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramItemBrandSchema, "params"),
  itemBrandController.fetchByID
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramItemBrandSchema, "params"),
  itemBrandController.delete
);

export default router;
