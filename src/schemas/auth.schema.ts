import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { existsField, requiredText } from "./common.schema";

/**
 * Kontrak API untuk autentikasi.
 *
 * Perhatikan password lama dan baru pada penggantian password hanya diperiksa
 * KEBERADAANNYA (exists), bukan isinya — rantai lama memang begitu, sehingga
 * teks kosong ikut lolos ke bcrypt. Dipertahankan; mengetatkannya adalah
 * perubahan perilaku tersendiri.
 */

/** POST /auth */
export const loginSchema = z.object({
  username: requiredText(ErrorList["USERNAME_REQUIRED"]),
  password: requiredText(ErrorList["PASSWORD_REQUIRED"]),
});

/** POST /auth/update-password */
export const updatePasswordSchema = z.object({
  oldPassword: existsField(ErrorList["OLD_PASSWORD_REQUIRED"]),
  newPassword: existsField(ErrorList["NEW_PASSWORD_REQUIRED"]),
});

/** POST /auth/refresh-token — token dikirim lewat header, bukan badan. */
export const refreshTokenHeaderSchema = z.object({
  "x-token": requiredText(ErrorList["REFRESH_TOKEN_NOT_FOUND"]),
});
