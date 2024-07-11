import { Router } from "express";
import ItemStockController from "../controllers/item-stock.controller";

const router = Router();

router.get("/:id", ItemStockController.fetchByItemID);
router.get("/", ItemStockController.fetch);

export default router;
