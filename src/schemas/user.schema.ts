import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { existsField, mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk pengguna.
 *
 * `accessLevel` diperiksa dengan isInt() pada rantai lama, dan isInt()
 * mengubah nilai menjadi teks lebih dulu — sehingga "2" ikut lolos. Perilaku
 * longgar itu ditiru di sini; mengetatkannya akan menolak klien yang
 * mengirimnya sebagai teks.
 *
 * Perhatikan `id` pada PUT hanya diperiksa keberadaannya (exists), sedangkan
 * pada POST /reset-password diperiksa tidak kosong (notEmpty). Perbedaan itu
 * ada di kode lama dan dipertahankan.
 */

const accessLevel = z.any().refine(
  (nilai) =>
    nilai !== null &&
    nilai !== undefined &&
    String(nilai).trim() !== "" &&
    Number.isInteger(Number(nilai)),
  { message: ErrorList["ACCESS_LEVEL_REQUIRED"] }
);

/** POST /user */
export const createUserSchema = z.object({
  name: requiredText(ErrorList["NAME_REQUIRED"]),
  username: requiredText(ErrorList["USERNAME_REQUIRED"]),
  accessLevel: accessLevel,
});

/** PUT /user */
export const updateUserSchema = z.object({
  id: existsField(ErrorList["ID_REQUIRED"]),
  name: requiredText(ErrorList["NAME_REQUIRED"]),
  username: requiredText(ErrorList["USERNAME_REQUIRED"]),
  accessLevel: accessLevel,
});

/** POST /user/reset-password */
export const resetPasswordSchema = z.object({
  id: requiredText(ErrorList["ID_REQUIRED"]),
});

/** GET /user/:id dan DELETE /user/:id */
export const paramUserSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
