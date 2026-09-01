import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk jenis barang.
 *
 * Perhatikan `id` pada penyuntingan hanya diperiksa KEBERADAANNYA, tidak
 * bentuknya — rantai lama memang tidak memasang isMongoId() di sana, berbeda
 * dengan merek barang. Menambahkannya akan menolak permintaan yang selama ini
 * diterima, jadi dibiarkan sama.
 */

/** POST /itemType */
export const createItemTypeSchema = z.object({
  name: requiredText(ErrorList["NAME_REQUIRED"]),
  description: requiredText(ErrorList["DESCRIPTION_REQUIRED"]),
});

/** PUT /itemType */
export const updateItemTypeSchema = z.object({
  name: requiredText(ErrorList["NAME_REQUIRED"]),
  description: requiredText(ErrorList["DESCRIPTION_REQUIRED"]),
  id: requiredText(ErrorList["ID_REQUIRED"]),
});

/** GET /itemType/:id dan DELETE /itemType/:id */
export const paramItemTypeSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
