import { Router } from "express";
import DeliverySlipController from "../controllers/delivery-slip.controller";

const router = Router();

router.post("/", DeliverySlipController.create);

export default router;
