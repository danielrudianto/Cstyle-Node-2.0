import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import {
  mongoId,
  oneOfIgnoreCase,
  requiredText,
} from "./common.schema";

/**
 * Kontrak API untuk pelanggan.
 *
 * Aturan dan pesannya dipindahkan satu per satu dari rantai express-validator
 * di routes/customer.route.ts. URUTAN BIDANG DIPERTAHANKAN, karena urutan itu
 * menentukan pesan mana yang muncul lebih dulu saat beberapa bidang gagal
 * bersamaan — dan pesan itulah yang dibaca pengguna.
 *
 * Bidang `email` dan `npwp` memang tidak divalidasi sebelumnya, jadi di sini
 * pun tidak. Menambahkannya sekarang akan menolak pelanggan lama yang tidak
 * punya NPWP — data yang selama ini sah.
 */

const TIPE_PELANGGAN = ["bulk", "consignment"] as const;

/**
 * Bidang yang dipakai bersama oleh POST dan PUT.
 *
 * Nama bidangnya mengikuti badan permintaan, jadi `phone` — bukan
 * `phoneNumber` seperti di database.
 */
const bidangPelanggan = {
  name: requiredText(ErrorList["NAME_REQUIRED"]),
  address: requiredText(ErrorList["ADDRESS_REQUIRED"]),
  phone: requiredText(ErrorList["PHONE_NUMBER_REQUIRED"]),
  type: requiredText(ErrorList["TYPE_REQUIRED"]).pipe(
    oneOfIgnoreCase(TIPE_PELANGGAN, ErrorList["CUSTOMER_TYPE_INVALID"])
  ),
};

/** POST /customer */
export const createCustomerSchema = z.object(bidangPelanggan);

/**
 * PUT /customer/v2
 *
 * `id` diperiksa dua kali seperti sebelumnya: ada dulu, baru bentuknya. Dua
 * pesan itu berbeda dan keduanya sudah dikenal klien.
 */
export const updateCustomerSchema = z.object({
  id: requiredText(ErrorList["ID_REQUIRED"]).pipe(
    mongoId(ErrorList["ID_INVALID"])
  ),
  ...bidangPelanggan,
});

/** GET /customer/:id dan DELETE /customer/:id */
export const paramCustomerSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
