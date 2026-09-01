import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { mongoId, requiredText } from "./common.schema";

/**
 * Kontrak API untuk pemasok.
 *
 * `email` dan `npwp` memang tidak divalidasi di rantai lama, jadi di sini pun
 * tidak — menambahkannya akan menolak pemasok yang selama ini sah.
 */

const bidangPemasok = {
  name: requiredText(ErrorList["NAME_REQUIRED"]),
  address: requiredText(ErrorList["ADDRESS_REQUIRED"]),
  phone: requiredText(ErrorList["PHONE_NUMBER_REQUIRED"]),
};

/** POST /supplier */
export const createSupplierSchema = z.object(bidangPemasok);

/** PUT /supplier — id diperiksa lebih dulu, sesuai urutan rantai lama. */
export const updateSupplierSchema = z.object({
  id: requiredText(ErrorList["ID_REQUIRED"]).pipe(
    mongoId(ErrorList["ID_INVALID"])
  ),
  ...bidangPemasok,
});

/** GET /supplier/:id dan DELETE /supplier/:id */
export const paramSupplierSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
