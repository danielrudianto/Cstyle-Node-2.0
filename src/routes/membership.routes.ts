import { Router } from "express";
import MembershipController from "../controllers/membership.controller";
import MembershipPointController from "../controllers/membership-point.controller";
import { param } from "express-validator";
import { ErrorList } from "../data/error-list";

const router = Router();

router.get("/conversion/history", MembershipPointController.fetch);
router.get("/conversion", MembershipPointController.fetchCurrent);
router.post("/conversion", MembershipPointController.create);
router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  MembershipController.fetchByID
);

router.put("/", MembershipController.updateByID);
router.get("/", MembershipController.fetch);

export default router;
