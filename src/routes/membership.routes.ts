import { Router } from "express";
import MembershipController from "../controllers/membership.controller";
import MembershipPointController from "../controllers/membership-point.controller";

const router = Router();

router.get("/conversion/history", MembershipPointController.fetch);
router.get("/conversion", MembershipPointController.fetchCurrent);
router.post("/conversion", MembershipPointController.create);

export default router;
