import { Router } from "express";
import DeliverySlipController from "../controllers/delivery-slip.controller";

const router = Router();

router.post("/", DeliverySlipController.create);
router.get("/unconfirmed", DeliverySlipController.fetchUnconfirmed);
router.get("/:id", DeliverySlipController.fetchByID);
router.put("/confirm", DeliverySlipController.confirm);

export default router;
