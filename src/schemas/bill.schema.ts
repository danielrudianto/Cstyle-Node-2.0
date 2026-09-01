import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { mongoId } from "./common.schema";

/**
 * Kontrak API untuk nota kasir.
 *
 * Hanya ada pemeriksaan parameter id. Badan permintaan POST /bill — pencarian
 * — memang tidak divalidasi sama sekali di rantai lama, dan itu dipertahankan.
 *
 * Perhatikan DELETE /bill/:id juga tidak pernah memeriksa bentuk id-nya,
 * berbeda dari GET. Dibiarkan sama supaya perilakunya tidak berubah.
 */

/** GET /bill/:id */
export const paramBillSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
