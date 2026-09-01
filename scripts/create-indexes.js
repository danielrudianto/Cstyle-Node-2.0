/*
  Membuat indeks yang cocok dengan bentuk query di repositories/.

  AMAN DIULANG: createIndex() tidak melakukan apa-apa kalau indeksnya sudah ada.

  JALANKAN SETELAH kode baru dirilis, bukan sebelumnya. Sebagian indeks di sini
  disusun untuk penyaring rentang tanggal — bentuk yang baru dipakai setelah
  $expr $month/$year diganti. Dibuat lebih awal pun tidak berbahaya, hanya
  belum terpakai.

  Cara pakai:
    mongosh Cstyle --quiet --file scripts/create-indexes.js
*/

const buat = (koleksi, kunci, opsi) => {
  const nama = db.getCollection(koleksi).createIndex(kunci, opsi || {});
  print("  " + koleksi + " <- " + JSON.stringify(kunci) + "  (" + nama + ")");
};

print("");
print("=== stocks — paling mendesak ===");
/*
  StockRepository.increment() menjalankan findOneAndUpdate({storeID, itemID})
  untuk SETIAP baris barang pada SETIAP nota yang masuk. Tanpa indeks, tiap
  panggilan memindai seluruh koleksi. Pada 11.506 baris stok, satu nota berisi
  20 barang berarti 230.000 pemeriksaan dokumen — hanya untuk mengurangi stok.
*/
buat("stocks", { itemID: 1, storeID: 1 });
buat("stocks", { storeID: 1, quantity: 1 });

print("");
print("=== persediaan ===");
buat("stock-ins", { itemID: 1, residue: 1, date: 1 });
buat("stock-outs", { stockInID: 1 });
buat("stock-outs", { date: 1 });
buat("stock-outs", { itemID: 1, date: 1 });
buat("stock-cards", { itemID: 1, date: 1 });
buat("stock-cards", { stockInID: 1 });
buat("stock-cards", { deliverySlipID: 1 });
buat("overflows", { itemID: 1 });

print("");
print("=== nota kasir ===");
/*
  Keunikan nomor nota berlaku PER TOKO, bukan global.

  Perpindahan dari unique { name } — termasuk membuang indeks lamanya —
  dikerjakan scripts/migrate-bill-name-index.js. Di sini indeksnya hanya
  dipastikan ada; createIndex() tidak akan membuang yang lama.
*/
buat("bills", { storeID: 1, name: 1 }, { unique: true });
buat("bills", { storeID: 1, date: -1 });
buat("bills", { isHidden: 1, storeID: 1, date: -1 });
buat("bills", { storeID: 1, isDelete: 1, createdAt: -1 });
buat("bills", { isDelete: 1, memberID: 1, date: -1 });

print("");
print("=== dokumen penjualan dan pembelian ===");
buat("invoices", { isDelete: 1, isPaid: 1, date: -1 });
buat("invoices", { isHidden: 1, date: 1 });
buat("invoices", { packingListID: 1 });
buat("invoices", { deliverySlipID: 1 });
buat("packing-lists", { isDelete: 1, date: -1 });
buat("delivery-slips", { isDelete: 1, isReturn: 1, date: 1 });
buat("good-receipts", { isDelete: 1, date: 1 });
buat("quotations", { isDelete: 1, date: 1 });
buat("adjustment-events", { isDelete: 1, date: 1 });

print("");
print("=== transfer stok ===");
buat("stock-requests", { isDelete: 1, createdAt: -1 });
buat("stock-requests", { requestTo: 1, isSending: 1, isDelete: 1 });
buat("stock-requests", { requestFrom: 1, isSending: 1, isConfirm: 1, isReject: 1, isDelete: 1 });

print("");
print("=== data induk ===");
buat("items", { isDelete: 1, isActive: 1, reference: 1 });
buat("items", { barcode: 1 });
buat("customers", { isDelete: 1, name: 1 });
buat("suppliers", { isDelete: 1, name: 1 });
buat("memberships", { storeID: 1, createdAt: -1 });
buat("itembrands", { isDelete: 1, name: 1 });
buat("itemtypes", { isDelete: 1, name: 1 });
buat("users", { isActive: 1, accessLevel: 1 });
buat("migrations", { migration_version: 1 });

print("");
print("Selesai. Periksa pemakaiannya dengan:");
print('  db.bills.find({...}).explain("executionStats").executionStats');
print("");
