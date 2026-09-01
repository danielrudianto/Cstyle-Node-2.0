import { Router } from "express";
import UserController from "../controllers/user.controller";
import AccessInterceptor from "../interceptors/access.interceptor";
import { UserRepository } from "../repositories/user.repository";
import {
  createUserSchema,
  paramUserSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "../schemas/user.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const userController = new UserController(new UserRepository(conn));

router.post(
  "/reset-password",
  AccessInterceptor.administratorRequired,
  validate(resetPasswordSchema),
  userController.resetPassword
);

router.post(
  "/",
  AccessInterceptor.administratorRequired,
  validate(createUserSchema),
  userController.create
);

/* "/sales/autocomplete" harus tetap SEBELUM "/:id". */
router.get("/sales/autocomplete", userController.fetchSales);

router.get(
  "/:id",
  validate(paramUserSchema, "params"),
  userController.fetchByID
);

router.get("/", userController.fetch);

/*
  PUT /user sengaja TANPA AccessInterceptor, sama seperti sebelumnya —
  setiap pengguna yang sudah masuk bisa memanggilnya, termasuk mengubah
  accessLevel miliknya sendiri. Ini cacat hak akses yang sudah ada dan
  perbaikannya dikerjakan terpisah dari refactor ini.
*/
router.put("/", validate(updateUserSchema), userController.updateByID);

router.delete(
  "/:id",
  AccessInterceptor.administratorRequired,
  validate(paramUserSchema, "params"),
  userController.deleteByID
);

export default router;
