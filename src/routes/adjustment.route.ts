import { Router } from "express";
import AdjustmentController from "../controllers/adjustment.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { AdjustmentRepository } from "../repositories/adjustment.repository";
import { StockRepository } from "../repositories/stock.repository";
import {
  createAdjustmentSchema,
  paramAdjustmentSchema,
} from "../schemas/adjustment.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const adjustmentController = new AdjustmentController(
  new AdjustmentRepository(conn),
  new StockRepository(conn)
);

/* "/search/v2" harus tetap SEBELUM "/:id". */
router.post(
  "/search/v2",
  AccessInterceptor.supervisorRequired,
  adjustmentController.fetch
);

router.post(
  "/",
  AccessInterceptor.supervisorRequired,
  validate(createAdjustmentSchema),
  adjustmentController.create
);

router.get(
  "/:id",
  AccessInterceptor.supervisorRequired,
  validate(paramAdjustmentSchema, "params"),
  adjustmentController.fetchByID
);

router.delete(
  "/:id",
  AccessInterceptor.supervisorRequired,
  validate(paramAdjustmentSchema, "params"),
  adjustmentController.deleteByID
);

export default router;
