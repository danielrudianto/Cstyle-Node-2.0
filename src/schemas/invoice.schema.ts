import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { existsField, mongoId, oneOfIgnoreCase } from "./common.schema";

/**
 * Kontrak API untuk faktur penjualan.
 *
 * Metode pembayaran dibatasi "cash" dan "transfer" — tidak sama dengan daftar
 * metode di laporan kasir, yang jauh lebih panjang. Keduanya memang dua jalur
 * yang berbeda: ini penagihan grosir, itu penjualan ritel.
 */

const METODE_BAYAR = ["cash", "transfer"] as const;

/** POST /invoice/payment */
export const updateInvoicePaymentSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
  paidAt: existsField(ErrorList["DATE_REQUIRED"]),
  paymentMethod: existsField(ErrorList["PAYMENT_METHOD_REQUIRED"]).pipe(
    oneOfIgnoreCase(METODE_BAYAR, ErrorList["PAYMENT_METHOD_INVALID"])
  ),
  amount: z
    .any()
    .refine(
      (nilai) =>
        nilai !== null &&
        nilai !== undefined &&
        String(nilai).trim() !== "" &&
        !Number.isNaN(Number(nilai)) &&
        Number(nilai) >= 0,
      { message: ErrorList["AMOUNT_INVALID"] }
    ),
});

/** GET /invoice/:id, DELETE /invoice/:id, DELETE /invoice/payment/:id */
export const paramInvoiceSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
