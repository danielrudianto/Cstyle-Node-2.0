/*
  Memindahkan keunikan nomor nota dari `name` saja menjadi { storeID, name }.

  KENAPA.

  Nomor nota dibuat di perangkat kasir: "B-CS-2026-09-" ditambah delapan digit
  acak, tanpa kode toko. Enam toko memakai satu ruang angka yang sama, dan
  indeks unique-nya berlaku global — jadi dua toko yang kebetulan mendapat
  angka sama dianggap bentrok. Sekitar 27% kemungkinan terjadi tiap bulan pada
  volume sekarang (~7.950 nota/bulan terhadap 10^8 kemungkinan).

  Yang membuatnya berbahaya adalah penanganannya: sinkronisasi membuang nota
  yang namanya sudah ada, tanpa jejak, dan perangkatnya mengulang tiap tiga
  puluh detik selamanya. Dengan toko ikut masuk kunci, keduanya sah.

  AMAN PADA DATA YANG ADA.

  Selama ini `name` unique global, jadi tiap pasangan { storeID, name } dengan
  sendirinya sudah unik. Pembuatan indeks barunya tidak mungkin gagal karena
  kunci ganda. Skrip ini tetap memeriksanya lebih dulu.

  URUTAN. Jalankan SEBELUM merilis kode baru. Indeks baru dibuat dulu, indeks
  lama dibuang belakangan — jadi pada tiap saat selalu ada yang menjaga.

  AMAN DIULANG.

  Cara pakai:
    mongosh Cstyle --quiet --file scripts/migrate-bill-name-index.js
*/

const indeks = db.bills.getIndexes();
const punya = (n) => indeks.some((i) => i.name === n);

print("");
print("Indeks bills saat ini:");
indeks.forEach((i) =>
  print("  " + i.name + "  " + JSON.stringify(i.key) + (i.unique ? "  unique" : ""))
);

/* --------------------------------------------------------------- */
print("");
print("=== 1. Memastikan tidak ada { storeID, name } kembar ===");

const kembar = db.bills
  .aggregate([
    { $group: { _id: { storeID: "$storeID", name: "$name" }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
    { $limit: 20 },
  ])
  .toArray();

if (kembar.length > 0) {
  print("  DITEMUKAN " + kembar.length + " pasangan kembar — migrasi DIHENTIKAN:");
  kembar.forEach((k) => print("    " + k._id.storeID + "  " + k._id.name + "  x" + k.n));
  print("");
  print("  Bereskan dulu; indeks unique tidak akan bisa dibuat selama ini ada.");
  quit(1);
}
print("  bersih");

/* --------------------------------------------------------------- */
print("");
print("=== 2. Membuat indeks gabungan ===");

if (punya("storeID_1_name_1")) {
  print("  sudah ada");
} else {
  print("  " + db.bills.createIndex({ storeID: 1, name: 1 }, { unique: true }));
}

/* --------------------------------------------------------------- */
print("");
print("=== 3. Membuang indeks unique lama pada name ===");
/*
  Dibuang BELAKANGAN, dan hanya kalau ia memang unique. Indeks biasa pada
  `name` (tanpa unique) berguna untuk pencarian dan tidak diganggu.
*/
const lama = indeks.find(
  (i) => i.unique && JSON.stringify(i.key) === JSON.stringify({ name: 1 })
);

if (lama == null) {
  print("  tidak ada (mungkin sudah dijalankan sebelumnya)");
} else {
  db.bills.dropIndex(lama.name);
  print("  dibuang: " + lama.name);
}

/* --------------------------------------------------------------- */
print("");
print("Indeks bills sesudahnya:");
db.bills
  .getIndexes()
  .forEach((i) =>
    print("  " + i.name + "  " + JSON.stringify(i.key) + (i.unique ? "  unique" : ""))
  );
print("");
print("Selesai.");
