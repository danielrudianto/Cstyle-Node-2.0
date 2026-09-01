import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { existsField, mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk packing list.
 *
 * Urutan bidang mengikuti rantai lama persis, karena urutan itulah yang
 * menentukan pesan mana yang muncul lebih dulu.
 *
 * `salesID` dan `note` hanya diperiksa KEBERADAANNYA (exists), sedangkan
 * `customerID` harus tidak kosong (notEmpty) — perbedaan itu ada di kode lama
 * dan dipertahankan.
 */

const jumlahBarang = z
  .any()
  .refine(
    (nilai) =>
      nilai !== null && nilai !== undefined && String(nilai).length > 0,
    { message: ErrorList["QUANTITY_REQUIRED"] }
  )
  .refine(
    (nilai) => Number.isInteger(Number(nilai)) && Number(nilai) >= 1,
    { message: ErrorList["QUANTITY_INVALID"] }
  );

const hargaBarang = z
  .any()
  .refine(
    (nilai) =>
      nilai !== null &&
      nilai !== undefined &&
      String(nilai).trim() !== "" &&
      !Number.isNaN(Number(nilai)) &&
      Number(nilai) >= 0,
    { message: ErrorList["PRICE_INVALID"] }
  );

/** POST /packing-list */
export const createPackingListSchema = z.object({
  date: requiredText(ErrorList["DATE_REQUIRED"]),
  dueDate: requiredText(ErrorList["DUE_DATE_REQUIRED"]),
  note: existsField(ErrorList["NOTE_REQUIRED"]),
  invoiceNote: existsField(ErrorList["INVOICE_NOTE_REQUIRED"]),
  salesID: existsField(ErrorList["SALES_REQUIRED"]),
  customerID: requiredText(ErrorList["CUSTOMER_REQUIRED"]),
  items: z
    .any()
    .refine((nilai) => Array.isArray(nilai), {
      message: ErrorList["ITEMS_REQUIRED"],
    })
    .pipe(
      z.array(
        z.object({
          itemID: requiredText(ErrorList["ITEM_REQUIRED"]),
          quantity: jumlahBarang,
          price: hargaBarang,
        })
      )
    ),
});

/** GET /packing-list/:id */
export const paramPackingListSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
