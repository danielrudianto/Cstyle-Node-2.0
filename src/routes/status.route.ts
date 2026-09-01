import { Router } from "express";
import StatusController from "../controllers/status.controller";
import { BillRepository } from "../repositories/bill.repository";
import { ItemBrandRepository } from "../repositories/item-brand.repository";
import { ItemRepository } from "../repositories/item.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { ItemTypeRepository } from "../repositories/item-type.repository";
import { conn } from "../utils/database.helper";

const router = Router();

const statusController = new StatusController(
  new ItemRepository(conn),
  new ItemBrandRepository(conn),
  new ItemTypeRepository(conn),
  new MembershipRepository(conn),
  new BillRepository(conn)
);

/* "/membership" dan "/item" harus tetap SEBELUM "/". */
router.get("/membership", statusController.fetchStatusMembership);
router.get("/item", statusController.fetchStatusItem);
router.get("/", statusController.fetchStatusDashboard);

export default router;
