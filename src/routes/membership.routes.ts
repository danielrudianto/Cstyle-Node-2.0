import { Router } from "express";
import MembershipController from "../controllers/membership.controller";

const router = Router();

router.get("/conversion", MembershipController.fetchConversion);
router.post("/conversion", MembershipController.createConversion);

export default router;
