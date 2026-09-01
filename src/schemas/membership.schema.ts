import { z } from "zod";
import { ErrorList } from "../constants/error-list.constant";
import { mongoId, oneOfIgnoreCase, requiredText } from "./common.schema";

/**
 * Kontrak API untuk keanggotaan.
 *
 * Aturan pembuatan anggota datang dari routes/cashier/membership.cashier.route.ts
 * — anggota memang didaftarkan dari perangkat kasir, bukan dari kantor.
 *
 * `phoneNumber` punya aturan gabungan: ia boleh kosong ASAL email terisi.
 * Aturan itu ditulis sebagai pemeriksaan pada seluruh objek, bukan pada satu
 * bidang, supaya bisa melihat keduanya sekaligus.
 */

const BAHASA = ["en", "id"] as const;

/** POST /cashier/membership */
export const createMembershipSchema = z
  .object({
    name: requiredText(ErrorList["NAME_REQUIRED"]),
    code: requiredText(ErrorList["CODE_REQUIRED"]),
    language: requiredText(ErrorList["LANGUAGE_REQUIRED"]).pipe(
      oneOfIgnoreCase(BAHASA, ErrorList["LANGUAGE_INVALID"])
    ),
  })
  .loose()
  .refine(
    (badan: any) => Boolean(badan.phoneNumber) || Boolean(badan.email),
    { message: ErrorList["PHONE_EMAIL_REQUIRED"] }
  );

/** GET /cashier/membership/code/:membershipCode */
export const paramMembershipCodeSchema = z.object({
  membershipCode: z
    .any()
    .refine((nilai) => /^[a-zA-Z0-9]+$/.test(String(nilai ?? "")), {
      message: ErrorList["UID_INVALID"],
    }),
});

/** GET /membership/:id */
export const paramMembershipSchema = z.object({
  id: mongoId(ErrorList["ID_INVALID"]),
});
