import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { existsField, mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk permintaan transfer stok.
 *
 * `requestFrom` dan `requestTo` diperiksa dengan exists(), BUKAN notEmpty() —
 * dan itu disengaja: null adalah nilai yang sah dan berarti gudang pusat.
 */

const idWajib = requiredText(ErrorList["ID_REQUIRED"]).pipe(
  mongoId(ErrorList["ID_INVALID"])
);

/** POST /stock-transfer/unreceived */
export const fetchUnreceivedSchema = z.object({
  requestFrom: existsField(ErrorList["STORE_ID_REQUIRED"]),
});

/** POST /stock-transfer/unsent */
export const fetchUnsentSchema = z.object({
  requestTo: existsField(ErrorList["STORE_ID_REQUIRED"]),
});

/** POST /stock-transfer/send */
export const sendStockRequestSchema = z.object({
  id: idWajib,
  items: z
    .any()
    .refine((nilai) => nilai !== null && nilai !== undefined, {
      message: ErrorList["ITEMS_REQUIRED"],
    })
    .refine((nilai) => Array.isArray(nilai), {
      message: ErrorList["ITEMS_INVALID"],
    }),
});

/** POST /stock-transfer/confirm */
export const confirmStockRequestSchema = z.object({
  id: idWajib,
});

/**
 * POST /stock-transfer/reject
 *
 * Perhatikan: yang divalidasi `rejectNote`, tapi controller membaca
 * `req.body.reason`. Ketidakcocokan itu ada di kode lama dan sengaja belum
 * diselaraskan — lihat catatan pada StockRequestController.reject().
 */
export const rejectStockRequestSchema = z.object({
  id: idWajib,
  rejectNote: requiredText(ErrorList["REJECT_NOTE_REQUIRED"]),
});

/** GET /stock-transfer/:id dan DELETE /stock-transfer/:id */
export const paramStockRequestSchema = z.object({
  id: requiredText(ErrorList["ID_REQUIRED"]).pipe(
    mongoId(ErrorList["ID_INVALID"])
  ),
});
