import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

/**
 * Menjalankan skema Zod terhadap satu bagian permintaan.
 *
 * Bentuk balasan galat mengikuti ErrorInterceptor.intercept yang dulu dipakai
 * bersama express-validator: status 400 dengan badan berupa STRING MENTAH
 * berisi pesan pertama yang gagal — bukan JSON. Klien menampilkan isinya apa
 * adanya, jadi mengubah bentuknya akan mengubah tampilan di layar pengguna.
 *
 * Badan permintaan SENGAJA tidak diganti dengan hasil parse. `req.body` juga
 * menampung `userID`, `storeID`, dan `employeeID` yang ditulis
 * auth.interceptor SEBELUM validasi berjalan; kalau badan permintaan ditimpa
 * hasil parse, ketiganya ikut terhapus dan controller kehilangan identitas
 * pemanggil tanpa galat apa pun.
 *
 * Pemakaian ini juga menutup satu cacat lama: pada beberapa route, validator
 * dideklarasikan tapi ErrorInterceptor tidak pernah dipasang, sehingga
 * hasilnya tidak pernah dibaca dan masukan cacat lolos ke Mongoose. Dengan
 * validate(), pemeriksaan dan pembacaan hasilnya jadi satu langkah yang tidak
 * bisa dipisah.
 *
 * Sumber "headers" dipakai untuk token penyegar, yang memang dikirim lewat
 * header dan bukan badan permintaan. Nama header pada req.headers selalu
 * huruf kecil, jadi skemanya harus memakai "x-token", bukan "X-Token".
 */
export const validate =
  (
    schema: ZodType,
    sumber: "body" | "query" | "params" | "headers" = "body"
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    const hasil = schema.safeParse(req[sumber]);

    if (!hasil.success) {
      return res.status(400).send(hasil.error.issues[0].message);
    }

    return next();
  };
