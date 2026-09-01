import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { existsField, mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk penawaran.
 *
 * `expiry_date` memang tidak divalidasi di rantai lama meski dipakai
 * controller — kalau tidak dikirim, new Date(undefined) menghasilkan Invalid
 * Date dan Mongoose menolaknya belakangan. Dibiarkan sama.
 */

/** POST /quotation */
export const createQuotationSchema = z.object({
  customer_id: requiredText(ErrorList["CUSTOMER_REQUIRED"]),
  items: requiredText(ErrorList["ITEM_REQUIRED"]),
  note: existsField(ErrorList["NOTE_REQUIRED"]),
  date: requiredText(ErrorList["DATE_REQUIRED"]),
});

/** GET /quotation/:id dan DELETE /quotation/:id */
export const paramQuotationSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
