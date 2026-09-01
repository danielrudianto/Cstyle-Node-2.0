/*
  Menghitung ulang `residue` pada setiap baris stock-ins.

  LATAR BELAKANG.

  `residue` adalah DATA TURUNAN, bukan data sumber. Menurut definisinya:

      residue = quantity - Σ(quantity seluruh stock-out yang menunjuk ke baris ini)

  Pemeriksaan produksi pada 1 September 2026 menemukan 5.074 dari 11.588 baris
  (44%) melanggar definisi itu:

      residue KEKURANGAN :   638 baris, total -241.626 unit
      residue KELEBIHAN  : 4.436 baris, total  +91.933 unit
      net                : -149.693 unit

  Penyebabnya removeStockOut() versi lama. Ia harus mengerjakan dua tulisan
  berpasangan — mengembalikan residue dan menghapus stock-out — tetapi
  dijalankan di dalam forEach dengan callback async, tanpa ditunggu dan tanpa
  transaksi. Pasangan yang hanya separuh berjalan menghasilkan tepat dua pola
  di atas. Jalur itu sudah diperbaiki di src/services/stock.service.ts, tetapi
  data lamanya tidak ikut membaik dengan sendirinya.

  KENAPA AMAN MENGHITUNG ULANG.

  Diperiksa lebih dulu, dan keduanya bersih:

      stock-out dengan stockInID kosong          : 0
      stock-out menunjuk stock-in yang sudah tiada: 0

  Jadi koleksi stock-outs utuh dan bisa dijadikan acuan. Tidak ada jalur yang
  mengurangi residue TANPA membuat stock-out: surat jalan memakai
  insertStockOutCardOnly() yang sengaja tidak menyentuh residue sama sekali.

  YANG TIDAK BERUBAH.

  Laporan harga pokok dihitung dari baris stock-out, bukan dari residue —
  lihat StockOutRepository.fetchProductReport(). Jadi skrip ini TIDAK mengubah
  satu pun angka HPP yang sudah pernah dicetak. Yang diperbaiki adalah alokasi
  FIFO ke depan: lapisan harga mana yang dipakai penjualan berikutnya.

  CARA PAKAI.

    # 1. Lihat dulu — TIDAK menulis apa pun:
    mongosh Cstyle --quiet --file scripts/repair-stock-in-residue.js

    # 2. Kalau angkanya masuk akal:
    mongosh Cstyle --quiet --eval 'var APPLY=true' --file scripts/repair-stock-in-residue.js

  Jalankan saat pekerja antrian BERHENTI. Kalau worker sedang memproses
  stock-out, residue bergerak di tengah perhitungan dan hasilnya jadi campuran.

    pm2 stop worker && <jalankan skrip> && pm2 start worker
*/

const APPLY = typeof globalThis.APPLY !== "undefined" && globalThis.APPLY === true;
const BATCH = 1000;

const stockIns = db.getCollection("stock-ins");
const stockOuts = db.getCollection("stock-outs");

print("");
print(APPLY ? ">>> MODE: MENULIS" : ">>> MODE: DRY-RUN (tidak menulis apa pun)");
print("");

/* Pemeriksaan pendahuluan: kalau ini tidak nol, jangan lanjut. */
const tanpaSumber = stockOuts.countDocuments({
  $or: [{ stockInID: null }, { stockInID: { $exists: false } }],
});

if (tanpaSumber > 0) {
  print("BATAL: ada " + tanpaSumber + " stock-out tanpa stockInID.");
  print("Residue tidak bisa dihitung ulang selama masih ada konsumsi tak terlacak.");
  quit(1);
}

/* Total konsumsi per stock-in, dihitung sekali. */
print("Menghitung konsumsi per stock-in...");
const terpakai = new Map();
stockOuts
  .aggregate([{ $group: { _id: "$stockInID", q: { $sum: "$quantity" } } }], {
    allowDiskUse: true,
  })
  .forEach((r) => terpakai.set(String(r._id), r.q));

print("stock-in yang pernah terpakai: " + terpakai.size);
print("");

let diperiksa = 0;
let cocok = 0;
let kelebihan = 0;
let kekurangan = 0;
let unitKelebihan = 0;
let unitKekurangan = 0;
let negatif = 0;
let ditulis = 0;
let batch = [];
const contoh = [];

const flush = () => {
  if (batch.length === 0) return;
  if (APPLY) {
    const hasil = stockIns.bulkWrite(batch, { ordered: false });
    ditulis += hasil.modifiedCount;
  }
  batch = [];
};

stockIns.find({}).forEach((s) => {
  diperiksa++;

  const konsumsi = terpakai.get(String(s._id)) || 0;
  const seharusnya = s.quantity - konsumsi;

  if (s.residue === seharusnya) {
    cocok++;
    return;
  }

  const selisih = s.residue - seharusnya;
  if (selisih > 0) {
    kelebihan++;
    unitKelebihan += selisih;
  } else {
    kekurangan++;
    unitKekurangan += selisih;
  }

  /*
    Nilai negatif berarti stock-out mengklaim lebih banyak daripada yang
    pernah masuk — itu tidak mungkin secara fisik, jadi barisnya DILEWATI dan
    dilaporkan supaya diperiksa manusia, bukan ditulis begitu saja.
  */
  if (seharusnya < 0) {
    negatif++;
    if (contoh.length < 10) {
      contoh.push({
        _id: String(s._id),
        itemID: String(s.itemID),
        quantity: s.quantity,
        konsumsi: konsumsi,
        residueSekarang: s.residue,
        seharusnya: seharusnya,
      });
    }
    return;
  }

  batch.push({
    updateOne: {
      filter: { _id: s._id },
      update: { $set: { residue: seharusnya } },
    },
  });

  if (batch.length >= BATCH) flush();
});

flush();

print("diperiksa            : " + diperiksa);
print("sudah benar          : " + cocok);
print("residue KELEBIHAN    : " + kelebihan + " baris, +" + unitKelebihan + " unit");
print("residue KEKURANGAN   : " + kekurangan + " baris, " + unitKekurangan + " unit");
print("net                  : " + (unitKelebihan + unitKekurangan) + " unit");
print("");

if (negatif > 0) {
  print("DILEWATI (hasil negatif): " + negatif + " baris — stock-out melebihi stock-in.");
  print("Baris berikut perlu diperiksa manual:");
  printjson(contoh);
  print("");
}

if (APPLY) {
  print("DIPERBARUI           : " + ditulis + " baris");
  const sisaBaru = stockIns
    .aggregate([{ $group: { _id: null, q: { $sum: "$residue" } } }])
    .toArray()[0];
  print("total residue sekarang: " + (sisaBaru ? sisaBaru.q : 0));
} else {
  const akanDitulis = kelebihan + kekurangan - negatif;
  print("Akan memperbarui " + akanDitulis + " baris.");
  print("Tidak ada yang ditulis. Ulangi dengan --eval 'var APPLY=true' untuk menerapkan.");
}

print("");
