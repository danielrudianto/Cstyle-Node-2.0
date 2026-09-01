import { z } from "zod";

/**
 * Potongan skema yang dipakai berulang di banyak domain.
 *
 * MENIRU express-validator, BUKAN MENGGANTIKANNYA.
 *
 * Refactor ini memindahkan struktur, bukan mengubah perilaku. Karena itu
 * pembantu di bawah sengaja meniru cara express-validator memperlakukan
 * nilai — termasuk kelonggarannya — supaya klien Electron yang sudah jalan
 * tidak tiba-tiba menerima 400.
 *
 * Kelonggaran yang ditiru: express-validator mengubah setiap nilai menjadi
 * teks SEBELUM memeriksanya, sehingga `.notEmpty()` meloloskan angka 123
 * (menjadi "123") dan objek (menjadi "[object Object]"). requiredText() di
 * bawah melakukan hal yang sama.
 *
 * Mengetatkannya menjadi z.string() murni adalah perubahan yang benar, tapi
 * itu perubahan PERILAKU: badan permintaan yang selama ini diterima akan
 * mulai ditolak, jadi harus naik bareng frontend. Kerjakan terpisah, jangan
 * disisipkan ke sini.
 *
 * Urutan bidang di dalam skema menentukan pesan mana yang muncul lebih dulu,
 * persis seperti urutan rantai validator sebelumnya. Mengubah urutannya
 * mengubah pesan yang dilihat pengguna.
 */

/** Nilai dianggap kosong bila undefined, null, atau teks kosong. */
const isiKosong = (nilai: unknown): boolean =>
  nilai === undefined || nilai === null || String(nilai).length === 0;

/**
 * Bidang wajib ada dan tidak kosong — meniru `.notEmpty()`.
 *
 * Nilai non-teks tetap lolos, sama seperti sebelumnya.
 */
export const requiredText = (pesan: string) =>
  z.any().refine((nilai) => !isiKosong(nilai), { message: pesan });

/**
 * Bidang wajib ada tapi boleh berisi teks kosong — meniru `.exists()`.
 *
 * Perbedaannya dengan requiredText() nyata dan disengaja di beberapa tempat,
 * jadi jangan disamakan tanpa memeriksa route-nya.
 */
export const existsField = (pesan: string) =>
  z.any().refine((nilai) => nilai !== undefined, { message: pesan });

/**
 * ObjectId MongoDB — meniru `.isMongoId()`.
 *
 * validator.js menerima 24 karakter heksadesimal. Bentuk lain, termasuk
 * ObjectId yang sudah jadi objek, ditolak seperti sebelumnya.
 */
export const mongoId = (pesan: string) =>
  z
    .any()
    .refine((nilai) => /^[0-9a-fA-F]{24}$/.test(String(nilai ?? "")), {
      message: pesan,
    });

/**
 * Salah satu dari daftar nilai, tanpa memandang besar-kecil huruf —
 * meniru `.toLowerCase().isIn([...])`.
 *
 * CATATAN: `.toLowerCase()` pada express-validator adalah sanitizer, jadi ia
 * ikut MENULIS ULANG req.body. validate.helper.ts sengaja tidak menulis ulang
 * badan permintaan (alasannya ada di sana), jadi nilai asli diteruskan apa
 * adanya ke controller. Untuk `customer.type` ini aman karena koleksinya
 * sudah memakai `lowercase: true`, jadi yang tersimpan tetap huruf kecil.
 * Kalau pembantu ini dipakai di bidang yang koleksinya TIDAK melakukan itu,
 * huruf besar akan ikut tersimpan — periksa dulu.
 */
export const oneOfIgnoreCase = (nilai: readonly string[], pesan: string) =>
  z.any().refine(
    (masukan) =>
      typeof masukan === "string" && nilai.includes(masukan.toLowerCase()),
    { message: pesan }
  );

/**
 * Bilangan bulat dari sumber teks, untuk req.params dan req.query.
 *
 * Nilai di sana selalu berupa teks, bahkan untuk angka, jadi perlu dipaksa
 * dulu sebelum diperiksa.
 */
export const intFromText = (pesan: string, min = 0) =>
  z.coerce.number({ error: pesan }).int(pesan).min(min, pesan);
