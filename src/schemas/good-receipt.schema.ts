import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk penerimaan barang.
 *
 * Perhatikan `name` hanya wajib saat PENYUNTINGAN, tidak saat pembuatan —
 * rantai lama memang begitu, jadi penerimaan barang bisa dibuat tanpa nomor
 * dokumen. Menambahkannya di sini akan menolak permintaan yang selama ini
 * diterima, jadi dibiarkan sama.
 *
 * Isi `items` juga tidak diperiksa per baris, padahal controller membacanya
 * sebagai `x.id`, `x.quantity`, `x.price`, dan `x.discount`. Baris yang tidak
 * lengkap lolos ke Mongoose dan gagal belakangan.
 */

/** POST /good-receipt */
export const createGoodReceiptSchema = z.object({
  supplier: requiredText(ErrorList["SUPPLIER_REQUIRED"]),
  date: requiredText(ErrorList["DATE_REQUIRED"]),
  items: z
    .any()
    .refine(
      (nilai) => Array.isArray(nilai) && nilai.length > 0,
      { message: ErrorList["ITEMS_REQUIRED"] }
    ),
});

/** PUT /good-receipt */
export const updateGoodReceiptSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
  name: requiredText(ErrorList["NAME_REQUIRED"]),
  supplier: requiredText(ErrorList["SUPPLIER_REQUIRED"]),
  date: requiredText(ErrorList["DATE_REQUIRED"]),
});

/** GET /good-receipt/:id dan DELETE /good-receipt/:id */
export const paramGoodReceiptSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
