import { Router } from "express";
import ItemStockController from "../controllers/item-stock.controller";
import { ItemRepository } from "../repositories/item.repository";
import { StockRepository } from "../repositories/stock.repository";
import { StoreRepository } from "../repositories/store.repository";
import { conn } from "../utils/database.helper";

const router = Router();

const itemStockController = new ItemStockController(
  new ItemRepository(conn),
  new StockRepository(conn),
  new StoreRepository(conn)
);

/* "/download" harus tetap SEBELUM "/:id". */
router.get("/download", itemStockController.download);
router.get("/:id", itemStockController.fetchByItemID);
router.get("/", itemStockController.fetch);

export default router;
