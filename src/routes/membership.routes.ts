import { Router } from "express";
import MembershipController from "../controllers/membership.controller";
import MembershipPointController from "../controllers/membership-point.controller";
import { param } from "express-validator";
import { ErrorList } from "../data/error-list";
import AccessInterceptor from "../interceptors/access.interceptor";

const router = Router();

router.get(
  "/conversion/history",
  AccessInterceptor.salesRequired,
  MembershipPointController.fetch
);
router.get(
  "/conversion",
  AccessInterceptor.salesRequired,
  MembershipPointController.fetchCurrent
);
router.post(
  "/conversion",
  AccessInterceptor.salesRequired,
  MembershipPointController.create
);
router.get(
  "/:id",
  AccessInterceptor.salesRequired,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  MembershipController.fetchByID
);

router.put(
  "/",
  AccessInterceptor.supervisorRequired,
  MembershipController.updateByID
);
router.get("/", AccessInterceptor.salesRequired, MembershipController.fetch);

export default router;
