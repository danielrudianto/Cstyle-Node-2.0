/*
  Backfill kartu stok untuk barang MASUK.

  LATAR BELAKANG.

  insertStockIn() dulu membangun objek kartu stoknya lalu membuangnya —
  `.create()` tidak pernah dipanggil. Akibatnya koleksi `stock-cards` hanya
  berisi pergerakan KELUAR. Terpastikan di produksi pada 1 September 2026:
  141.029 baris kartu stok, nol di antaranya untuk barang masuk.

  Perbaikan di src/services/stock.service.ts hanya berlaku untuk penerimaan
  barang BERIKUTNYA. Skrip ini mengisi yang sudah telanjur hilang, dengan
  membaca ulang koleksi `stock-ins` — sumber kebenarannya, yang tidak pernah
  bermasalah.

  AMAN DIULANG.

  Setiap kartu yang dibuat membawa `stockInID`, dan skrip ini melewati
  stock-in yang kartunya sudah ada. Menjalankannya dua kali tidak menggandakan
  baris.

  CARA PAKAI.

    # 1. Lihat dulu apa yang akan terjadi — TIDAK menulis apa pun:
    mongosh Cstyle --quiet --file scripts/backfill-stock-card.js

    # 2. Kalau angkanya masuk akal, jalankan sungguhan:
    mongosh Cstyle --quiet --eval 'var APPLY=true' --file scripts/backfill-stock-card.js

  CATATAN.

  `storeID` pada kartu hasil backfill diisi null, karena koleksi `stock-ins`
  memang tidak pernah menyimpan toko — bidang itu tidak ada di skemanya. Jadi
  riwayat lama tidak bisa dipisah per toko; hanya kartu baru yang bisa.
*/

const APPLY = typeof globalThis.APPLY !== "undefined" && globalThis.APPLY === true;
const BATCH = 1000;

const stockIns = db.getCollection("stock-ins");
const stockCards = db.getCollection("stock-cards");

print("");
print(APPLY ? ">>> MODE: MENULIS" : ">>> MODE: DRY-RUN (tidak menulis apa pun)");
print("");

const totalStockIn = stockIns.countDocuments();
const kartuSebelum = stockCards.countDocuments();
const kartuMasukSebelum = stockCards.countDocuments({ stockInID: { $ne: null } });

print("stock-ins              : " + totalStockIn);
print("kartu stok (semua)     : " + kartuSebelum);
print("kartu masuk (ber-link) : " + kartuMasukSebelum);
print("");

/* Kumpulkan stockInID yang kartunya SUDAH ada, supaya bisa dilewati. */
const sudahAda = new Set();
stockCards
  .find({ stockInID: { $ne: null } }, { stockInID: 1 })
  .forEach((c) => sudahAda.add(String(c.stockInID)));

let diperiksa = 0;
let dilewati = 0;
let disiapkan = 0;
let ditulis = 0;
let batch = [];

const flush = () => {
  if (batch.length === 0) return;
  if (APPLY) {
    const hasil = stockCards.bulkWrite(batch, { ordered: false });
    ditulis += hasil.insertedCount;
  }
  batch = [];
};

stockIns.find({}).forEach((s) => {
  diperiksa++;

  if (sudahAda.has(String(s._id))) {
    dilewati++;
    return;
  }

  batch.push({
    insertOne: {
      document: {
        itemID: s.itemID,
        storeID: null,
        quantity: s.quantity,
        date: s.date,
        billID: null,
        invoiceID: null,
        adjustmentEventID: s.adjustmentEventID ?? null,
        goodReceiptID: s.goodReceiptID ?? null,
        deliverySlipID: null,
        stockInID: s._id,
      },
    },
  });

  disiapkan++;

  if (batch.length >= BATCH) flush();
});

flush();

print("diperiksa              : " + diperiksa);
print("dilewati (sudah ada)   : " + dilewati);
print("disiapkan              : " + disiapkan);
print("");

if (APPLY) {
  print("DITULIS                : " + ditulis);
  print("kartu stok sekarang    : " + stockCards.countDocuments());
  print("kartu masuk sekarang   : " + stockCards.countDocuments({ stockInID: { $ne: null } }));
} else {
  print("Tidak ada yang ditulis. Jalankan ulang dengan --eval 'var APPLY=true' untuk menerapkan.");
}

print("");
