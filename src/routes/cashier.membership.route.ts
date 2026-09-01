import { Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import {
  createMembershipSchema,
  paramMembershipCodeSchema,
} from "../schemas/membership.schema";
import { validate } from "../utils/validate.helper";
import { membershipController } from "./cashier.container";

const router = Router();

router.post(
  "/",
  AuthInterceptor.anyIntercept,
  validate(createMembershipSchema),
  membershipController.create
);

router.get(
  "/code/:membershipCode",
  AuthInterceptor.anyIntercept,
  validate(paramMembershipCodeSchema, "params"),
  membershipController.fetchByCode
);

/*
  TANPA AUTENTIKASI SAMA SEKALI — sama seperti sebelumnya.

  "/cashier" dipasang di app.ts tanpa interceptor, dan route ini tidak memasang
  AuthInterceptor sendiri. Jadi siapa pun yang bisa menjangkau server ini bisa
  membaca seluruh daftar anggota, termasuk nomor telepon dan surel mereka.
  Dipertahankan supaya refactor ini tidak mengubah perilaku, tapi ini lubang
  yang perlu ditutup.
*/
router.get("/", membershipController.fetch);

export default router;
