import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { existsField, mongoId } from "./common.schema";

/**
 * Kontrak API untuk barang.
 *
 * Dipindahkan dari rantai express-validator di routes/item.route.ts. Perlu
 * dicatat: badan permintaan POST /item/v2 dan PUT /item/v2 TIDAK divalidasi
 * sama sekali di kode lama — isinya datang sebagai multipart dan barunya
 * di-JSON.parse() di dalam controller. Itu dibiarkan sama; memvalidasinya
 * sekarang berarti menambah aturan baru, bukan memindahkan yang ada.
 */

/** POST /item/price */
export const fetchItemPriceSchema = z.object({
  type: existsField(ErrorList["ITEM_TYPE_REQUIRED"]),
  brand: existsField(ErrorList["ITEM_BRAND_REQUIRED"]),
});

/** PUT /item/like */
export const updateItemFavoriteSchema = z.object({
  itemID: mongoId(ErrorList["ID_INVALID"]),
  isFavorite: z
    .any()
    .refine((nilai) => typeof nilai === "boolean", {
      message: ErrorList["IS_FAVORITE_INVALID"],
    }),
});

/**
 * PUT /item/price
 *
 * Harga diperiksa dua kali seperti sebelumnya: berupa angka, lalu tidak
 * negatif. Angka dalam bentuk teks tetap diterima, meniru isNumeric() yang
 * mengubah nilai menjadi teks sebelum memeriksanya.
 */
const hargaBarang = z
  .any()
  .refine(
    (nilai) =>
      nilai !== null &&
      nilai !== undefined &&
      String(nilai).trim() !== "" &&
      !Number.isNaN(Number(nilai)),
    { message: ErrorList["PRICE_INVALID"] }
  )
  .refine((nilai) => Number(nilai) >= 0, {
    message: ErrorList["PRICE_NEGATIVE"],
  });

export const updateItemPriceSchema = z.object({
  /*
    Pemeriksaan "berupa larik" harus berdiri sendiri di depan, supaya nilai
    yang bukan larik menghasilkan ITEMS_INVALID — bukan pesan bawaan Zod.
  */
  items: z
    .any()
    .refine((nilai) => Array.isArray(nilai), {
      message: ErrorList["ITEMS_INVALID"],
    })
    .pipe(
      z.array(
        z.object({
          id: mongoId(ErrorList["ID_INVALID"]),
          price: hargaBarang,
        })
      )
    ),
});

/** GET /item/:id dan DELETE /item/:id */
export const paramItemSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
