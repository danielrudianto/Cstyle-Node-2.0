import { Router } from "express";
import ItemTypeController from "../controllers/item-type.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { ItemTypeRepository } from "../repositories/item-type.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import {
  createItemTypeSchema,
  paramItemTypeSchema,
  updateItemTypeSchema,
} from "../schemas/item-type.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const itemTypeController = new ItemTypeController(
  new ItemTypeRepository(conn),
  new MigrationRepository(conn)
);

router.post(
  "/",
  AccessInterceptor.administratorRequired,
  validate(createItemTypeSchema),
  itemTypeController.create
);

router.put(
  "/",
  AccessInterceptor.administratorRequired,
  validate(updateItemTypeSchema),
  itemTypeController.update
);

/*
  "/autocomplete" dan "/v2" harus tetap SEBELUM "/:id". Keduanya sengaja tanpa
  pemeriksaan hak akses, sama seperti sebelumnya.
*/
router.get("/autocomplete", itemTypeController.fetchAutocomplete);
router.get("/v2", itemTypeController.fetch);

router.get(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramItemTypeSchema, "params"),
  itemTypeController.fetchByID
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramItemTypeSchema, "params"),
  itemTypeController.delete
);

export default router;
