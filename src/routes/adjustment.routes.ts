import { Router } from "express";
import AdjustmentEventController from "../controllers/adjustment-event.controller";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import ErrorInterceptor from "../interceptors/error.interceptor";

const router = Router();

router.post("/", AdjustmentEventController.create);

export default router;
