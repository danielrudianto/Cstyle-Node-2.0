import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk merek barang.
 *
 * Dipindahkan satu per satu dari rantai express-validator di
 * routes/item-brand.route.ts, dengan urutan bidang yang dipertahankan supaya
 * pesan yang muncul lebih dulu tetap sama.
 */

/** POST /itemBrand */
export const createItemBrandSchema = z.object({
  name: requiredText(ErrorList["NAME_REQUIRED"]),
});

/**
 * PUT /itemBrand
 *
 * Urutannya name dulu, baru id — mengikuti rantai lama, di mana
 * body("name") dideklarasikan sebelum body("id").
 */
export const updateItemBrandSchema = z.object({
  name: requiredText(ErrorList["NAME_REQUIRED"]),
  id: requiredText(ErrorList["ID_REQUIRED"]).pipe(
    mongoId(ErrorList["ID_INVALID"])
  ),
});

/** GET /itemBrand/:id dan DELETE /itemBrand/:id */
export const paramItemBrandSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
