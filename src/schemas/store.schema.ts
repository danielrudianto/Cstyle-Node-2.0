import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk toko.
 *
 * Perhatikan `code` hanya wajib saat PEMBUATAN. Pada penyuntingan ia tidak
 * diperiksa dan memang tidak ikut diperbarui — kode toko dipakai aplikasi
 * kasir untuk mengenali dirinya, jadi sengaja tidak bisa diubah lewat sini.
 */

const bidangToko = {
  name: requiredText(ErrorList["STORE_NAME_REQUIRED"]),
  prefix: requiredText(ErrorList["STORE_PREFIX_REQUIRED"]),
  phoneNumber: requiredText(ErrorList["STORE_PHONE_NUMBER_REQUIRED"]),
  address: requiredText(ErrorList["STORE_ADDRESS_REQUIRED"]),
};

/** POST /store */
export const createStoreSchema = z.object({
  ...bidangToko,
  code: requiredText(ErrorList["CODE_REQUIRED"]),
});

/** PUT /store — urutan mengikuti rantai lama: id dulu, baru sisanya. */
export const updateStoreSchema = z.object({
  id: requiredText(ErrorList["ID_REQUIRED"]).pipe(
    mongoId(ErrorList["ID_INVALID"])
  ),
  ...bidangToko,
});

/** GET /store/:id dan DELETE /store/:id */
export const paramStoreSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
