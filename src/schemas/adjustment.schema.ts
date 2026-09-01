import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { existsField, mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk penyesuaian stok.
 *
 * `store` diperiksa dengan exists(), BUKAN notEmpty() — dan itu disengaja:
 * null adalah nilai yang sah dan berarti gudang pusat. Mengetatkannya menjadi
 * notEmpty() akan menolak seluruh penyesuaian di gudang.
 *
 * Isi `items` tidak diperiksa per baris, padahal controller membacanya sebagai
 * `x.id` dan `x.quantity`. Baris yang tidak lengkap lolos ke Mongoose dan
 * gagal belakangan. Aturan "quantity tidak boleh nol" juga dikerjakan di
 * controller, bukan di sini — mengikuti kode lama.
 */

/** POST /adjustment */
export const createAdjustmentSchema = z.object({
  date: requiredText(ErrorList["DATE_REQUIRED"]),
  items: z
    .any()
    .refine(
      (nilai) => Array.isArray(nilai) && nilai.length > 0,
      { message: ErrorList["ITEMS_REQUIRED"] }
    ),
  store: existsField(ErrorList["STORE_ID_REQUIRED"]),
});

/** GET /adjustment/:id dan DELETE /adjustment/:id */
export const paramAdjustmentSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
