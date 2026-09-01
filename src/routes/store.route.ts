import { NextFunction, Request, Response, Router } from "express";
import StoreController from "../controllers/store.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { StoreRepository } from "../repositories/store.repository";
import {
  createStoreSchema,
  paramStoreSchema,
  updateStoreSchema,
} from "../schemas/store.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const storeController = new StoreController(new StoreRepository(conn));

router.post(
  "/",
  AccessInterceptor.administratorRequired,
  validate(createStoreSchema),
  storeController.create
);

/* "/autocomplete" dan "/all" harus tetap SEBELUM "/:id". */
router.get("/autocomplete", storeController.fetchAutocomplete);

router.get(
  "/all",
  (req: Request, res: Response, next: NextFunction) => {
    /* storeID null berarti "seluruh toko", bukan "tidak ada toko". */
    req.body.storeID = null;
    next();
  },
  storeController.fetchOthers
);

router.get(
  "/:id",
  validate(paramStoreSchema, "params"),
  storeController.fetchByID
);

router.get("/", storeController.fetch);

router.put(
  "/",
  AccessInterceptor.administratorRequired,
  validate(updateStoreSchema),
  storeController.updateByID
);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramStoreSchema, "params"),
  storeController.deleteByID
);

export default router;
