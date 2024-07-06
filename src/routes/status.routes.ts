import { Router } from "express";
import StatusController from "../controllers/status.controller";

const router = Router();

router.get("/membership", StatusController.fetchStatusMembership);
router.get("/", StatusController.fetchStatusDashboard);

export default router;
