import { Router } from "express";
import MembershipPointController from "../controllers/membership-point.controller";
import MembershipController from "../controllers/membership.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { MembershipRepository } from "../repositories/membership.repository";
import { paramMembershipSchema } from "../schemas/membership.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

/* Keanggotaan dan kurs poinnya berbagi satu repository. */
const membershipRepository = new MembershipRepository(conn);

const membershipController = new MembershipController(membershipRepository);
const membershipPointController = new MembershipPointController(
  membershipRepository
);

/*
  Seluruh route "/conversion" harus tetap SEBELUM "/:id", supaya kata
  "conversion" tidak tertangkap sebagai id anggota.
*/
router.get(
  "/conversion/history",
  AccessInterceptor.salesRequired,
  membershipPointController.fetch
);

router.get(
  "/conversion",
  AccessInterceptor.salesRequired,
  membershipPointController.fetchCurrent
);

router.post(
  "/conversion",
  AccessInterceptor.salesRequired,
  membershipPointController.create
);

/*
  Rantai lama mendeklarasikan param("id").isMongoId() di sini TAPI tidak pernah
  memasang ErrorInterceptor sesudahnya, jadi hasil pemeriksaannya tidak pernah
  dibaca dan id cacat lolos ke Mongoose. validate() menyatukan pemeriksaan dan
  pembacaan hasilnya, jadi sekarang benar-benar berlaku.
*/
router.get(
  "/:id",
  AccessInterceptor.salesRequired,
  validate(paramMembershipSchema, "params"),
  membershipController.fetchByID
);

router.put(
  "/",
  AccessInterceptor.supervisorRequired,
  membershipController.updateByID
);

router.get("/", AccessInterceptor.salesRequired, membershipController.fetch);

export default router;
