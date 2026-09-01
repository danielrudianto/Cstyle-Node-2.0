/**
 * Penyaring rentang tanggal untuk satu bulan.
 *
 * ================== KENAPA INI ADA ==================
 *
 * Kode lama menyaring bulan dengan bentuk seperti ini:
 *
 *     $expr: { $and: [
 *       { $eq: [{ $month: "$date" }, month] },
 *       { $eq: [{ $year:  "$date" }, year  ] },
 *     ]}
 *
 * Bentuk itu memaksa MongoDB MENGHITUNG bulan dan tahun untuk SETIAP dokumen
 * sebelum bisa memutuskan — jadi indeks pada `date` tidak bisa dipakai sama
 * sekali, berapa pun indeks yang dibuat. Setiap laporan dan setiap pencarian
 * dokumen memindai seluruh koleksi.
 *
 * Pada koleksi `bills` yang berisi 190.878 dokumen, itu berarti 190.878
 * pemeriksaan untuk mengambil 20 baris. Dan karena daftar selalu dipasangkan
 * dengan countDocuments, pemindaiannya terjadi DUA KALI per permintaan.
 *
 * Rentang tanggal biasa bisa memakai indeks: MongoDB melompat langsung ke
 * awal bulan lalu berhenti di awal bulan berikutnya.
 *
 * ================== SOAL ZONA WAKTU ==================
 *
 * $month dan $year pada MongoDB memakai UTC kalau tidak diberi timezone.
 * Karena itu batas rentang di bawah dibangun dengan Date.UTC — supaya hasilnya
 * SAMA PERSIS dengan penyaring lama, bukan sekadar mirip.
 *
 * Kalau memakai new Date(year, month - 1, 1) — waktu setempat — hasilnya
 * hanya sama selama server berjalan di UTC. Server produksi memang UTC, tapi
 * mengandalkan itu diam-diam adalah jebakan: satu kali server dipindah, angka
 * laporan bergeser tanpa ada yang mengubah kode. Jadi UTC ditulis eksplisit.
 */

/** Rentang [awal bulan, awal bulan berikutnya) dalam UTC. */
export function monthRange(month: number, year: number) {
  return {
    $gte: new Date(Date.UTC(year, month - 1, 1)),
    $lt: new Date(Date.UTC(year, month, 1)),
  };
}

/**
 * Penyaring bulan untuk satu bidang tanggal.
 *
 * Pemakaian:
 *   const filter = { ...monthFilter("date", month, year), isDelete: false };
 */
export function monthFilter(field: string, month: number, year: number) {
  return { [field]: monthRange(month, year) };
}
