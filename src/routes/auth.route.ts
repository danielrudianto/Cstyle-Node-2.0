import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthInterceptor from "../interceptors/auth.interceptor";
import { UserRepository } from "../repositories/user.repository";
import {
  loginSchema,
  refreshTokenHeaderSchema,
  updatePasswordSchema,
} from "../schemas/auth.schema";
import { conn } from "../utils/database.helper";
import { validate } from "../utils/validate.helper";

const router = Router();

const authController = new AuthController(new UserRepository(conn));

/*
  Token penyegar dibaca dari header "x-token", jadi skemanya dijalankan
  terhadap req.headers — bukan req.body.
*/
router.post(
  "/refresh-token",
  validate(refreshTokenHeaderSchema, "headers"),
  authController.refreshToken
);

router.post(
  "/update-password",
  validate(updatePasswordSchema),
  AuthInterceptor.intercept,
  authController.updatePassword
);

router.post("/", validate(loginSchema), authController.login);

router.get("/", AuthInterceptor.intercept, authController.fetchProfile);

export default router;
