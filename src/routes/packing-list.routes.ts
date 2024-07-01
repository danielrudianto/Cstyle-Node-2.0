import { Router } from "express";
import PackingListController from "../controllers/packing-list.controller";

const router = Router();

router.post("/search/v2", PackingListController.fetch);
router.post("/", PackingListController.create);
router.get("/:id", PackingListController.fetchByID);

export default router;
