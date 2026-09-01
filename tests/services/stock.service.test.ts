import { StockService } from "../../src/services/stock.service";

/**
 * Uji mesin persediaan tanpa MongoDB.
 *
 * Seluruh repository dipalsukan. Ini baru mungkin setelah StockService
 * menerima repository lewat constructor — sebelum refactor, query-nya menempel
 * di model yang diimpor langsung, jadi logikanya tidak bisa dijalankan tanpa
 * menyalakan database.
 *
 * YANG DIUJI DI SINI ADALAH ANGKA HARGA POKOK. Kalau salah satu tes di berkas
 * ini merah, jangan diloloskan tanpa memahami sebabnya — yang bergeser adalah
 * nilai persediaan dan laba kotor pada laporan.
 */

type BarisStockIn = {
  _id: string;
  itemID: string;
  quantity: number;
  residue: number;
  price: number;
  date: number;
};

/**
 * Menyusun service dengan repository palsu.
 *
 * fetchFifo palsu meniru query aslinya: hanya baris bersisa, diurutkan
 * tanggal menaik. updateResidue MENGUBAH objek yang sama yang dikembalikan
 * fetchFifo — sengaja, karena justru itu yang membongkar kerapuhan kalau kode
 * membaca ulang `stockIn.residue` setelah menulis.
 */
const bikinService = (stockIns: BarisStockIn[]) => {
  const stockOuts: any[] = [];
  const cards: any[] = [];
  const overflows: any[] = [];

  const stockInRepo: any = {
    create: async (d: any) => {
      const row = { _id: `si${stockIns.length + 1}`, ...d };
      stockIns.push(row);
      return row;
    },
    fetchFifo: async (itemID: string) =>
      stockIns
        .filter((s) => s.itemID === itemID && s.residue > 0)
        .sort((a, b) => a.date - b.date)[0] ?? null,
    updateResidue: async (id: string, decr: number) => {
      const row = stockIns.find((s) => s._id === id)!;
      row.residue -= decr;
    },
  };

  const service = new StockService(
    { increment: async () => {} } as any,
    stockInRepo,
    {
      create: async (d: any) => {
        stockOuts.push(d);
        return d;
      },
    } as any,
    {
      create: async (d: any) => {
        cards.push(d);
        return d;
      },
    } as any,
    {
      create: async (d: any) => {
        overflows.push(d);
        return d;
      },
      fetchAll: async () => [...overflows],
      deleteByID: async () => {},
    } as any
  );

  return { service, stockIns, stockOuts, cards, overflows };
};

const permintaanKeluar = (over: Partial<any> = {}) => ({
  itemID: "A",
  quantity: 0,
  date: new Date(2026, 0, 10) as any,
  billID: "b1",
  invoiceID: null,
  adjustmentEventID: null,
  storeID: "toko1",
  ...over,
});

describe("insertStockIn", () => {
  it("menyimpan kartu stok untuk barang masuk", async () => {
    const t = bikinService([]);

    await t.service.insertStockIn({
      date: new Date(2026, 0, 1) as any,
      itemID: "A",
      quantity: 10,
      residue: 10,
      price: 1000,
      goodReceiptID: "gr1",
      adjustmentEventID: null,
      storeID: "toko1",
    });

    /*
      Sebelum diperbaiki, jumlah kartu di sini NOL: objeknya dibangun lalu
      dibuang karena .create() tidak pernah dipanggil. Terpastikan di produksi
      1 September 2026 — 141.029 kartu, tidak satu pun untuk barang masuk.
    */
    expect(t.cards).toHaveLength(1);
    expect(t.cards[0].quantity).toBe(10);
    expect(t.cards[0].storeID).toBe("toko1");
    expect(t.cards[0].stockInID).toBe("si1");
  });
});

describe("insertStockOut — penelusuran FIFO", () => {
  it("mengambil dari baris tertua dulu, lalu lanjut ke berikutnya", async () => {
    const t = bikinService([
      { _id: "si1", itemID: "A", quantity: 10, residue: 4, price: 1000, date: 1 },
      { _id: "si2", itemID: "A", quantity: 10, residue: 10, price: 1500, date: 2 },
    ]);

    await t.service.insertStockOut(permintaanKeluar({ quantity: 6 }));

    expect(t.stockOuts).toHaveLength(2);
    expect(t.stockOuts[0].quantity).toBe(4);
    expect(t.stockOuts[1].quantity).toBe(2);
    expect(t.stockIns[0].residue).toBe(0);
    expect(t.stockIns[1].residue).toBe(8);
    expect(t.overflows).toHaveLength(0);
  });

  it("harga pokoknya mengikuti baris asalnya, bukan rata-rata", async () => {
    const t = bikinService([
      { _id: "si1", itemID: "A", quantity: 10, residue: 4, price: 1000, date: 1 },
      { _id: "si2", itemID: "A", quantity: 10, residue: 10, price: 1500, date: 2 },
    ]);

    await t.service.insertStockOut(permintaanKeluar({ quantity: 6 }));

    /* Rantai stock-out -> stock-in itulah yang membuat HPP bisa ditelusuri. */
    expect(t.stockOuts[0].stockInID).toBe("si1");
    expect(t.stockOuts[1].stockInID).toBe("si2");
  });

  it("sisa yang tidak tertutup stok jatuh ke overflow, bukan hilang", async () => {
    const t = bikinService([
      { _id: "si1", itemID: "A", quantity: 10, residue: 2, price: 1000, date: 1 },
    ]);

    await t.service.insertStockOut(permintaanKeluar({ quantity: 5 }));

    expect(t.stockOuts[0].quantity).toBe(2);
    expect(t.overflows[0].quantity).toBe(3);
    /* Kartu stok tetap mencatat jumlah PENUH yang keluar. */
    expect(t.cards[0].quantity).toBe(5);
  });

  it("tidak menyentuh baris milik barang lain", async () => {
    const t = bikinService([
      { _id: "si1", itemID: "B", quantity: 10, residue: 10, price: 1000, date: 1 },
      { _id: "si2", itemID: "A", quantity: 10, residue: 10, price: 1500, date: 2 },
    ]);

    await t.service.insertStockOut(permintaanKeluar({ quantity: 3 }));

    expect(t.stockIns[0].residue).toBe(10);
    expect(t.stockIns[1].residue).toBe(7);
  });
});

describe("insertStockOutOnly — jalur penyelesaian overflow", () => {
  it("memakai residue, bukan quantity, sehingga sisa tidak menjadi minus", async () => {
    /*
      si1 sudah terpakai 8 dari 10, sisa 2. Kode LAMA membandingkan
      quantity (10) >= 5 lalu mengambil 5 sekaligus, dan residue-nya jatuh
      ke -3.
    */
    const t = bikinService([
      { _id: "si1", itemID: "A", quantity: 10, residue: 2, price: 1000, date: 1 },
      { _id: "si2", itemID: "A", quantity: 10, residue: 10, price: 1500, date: 2 },
    ]);

    await t.service.insertStockOutOnly(permintaanKeluar({ quantity: 5 }));

    expect(t.stockIns[0].residue).toBe(0);
    expect(t.stockIns[0].residue).toBeGreaterThanOrEqual(0);
    expect(t.stockOuts[0].quantity).toBe(2);
    expect(t.stockOuts[1].quantity).toBe(3);
    expect(t.stockIns[1].residue).toBe(7);
  });

  it("tidak berputar selamanya pada baris yang quantity-nya nol", async () => {
    /*
      Baris cacat: quantity 0 tapi residue 5. Kode LAMA membandingkan
      quantity (0) >= 3 -> salah, lalu 0 < 3 -> mengurangi nol, dan
      perulangannya tidak pernah maju.
    */
    const t = bikinService([
      { _id: "si1", itemID: "A", quantity: 0, residue: 5, price: 1000, date: 1 },
    ]);

    /*
      Timer-nya DIBERSIHKAN setelah balapan selesai. Kalau dibiarkan, Jest
      menggantung satu detik di akhir setiap kali dijalankan — kecil, tapi
      lama-lama membuat orang berhenti percaya pada keluaran tesnya.
    */
    let timer: NodeJS.Timeout;
    const batasWaktu = new Promise((r) => {
      timer = setTimeout(() => r("MACET"), 2000);
    });

    const selesai = await Promise.race([
      t.service
        .insertStockOutOnly(permintaanKeluar({ quantity: 3 }))
        .then(() => "selesai"),
      batasWaktu,
    ]).finally(() => clearTimeout(timer));

    expect(selesai).toBe("selesai");
    expect(t.stockIns[0].residue).toBe(2);
  });

  it("menolak baris yang sisanya tidak masuk akal, alih-alih membanjiri database", async () => {
    /* fetchFifo palsu sengaja mengabaikan penyaring residue > 0. */
    const t = bikinService([]);
    (t.service as any).stockInRepository = {
      fetchFifo: async () => ({
        _id: "si1",
        itemID: "A",
        quantity: 5,
        residue: -1,
        price: 1000,
        date: 1,
      }),
      updateResidue: async () => {},
    };

    await expect(
      t.service.insertStockOutOnly(permintaanKeluar({ quantity: 3 }))
    ).rejects.toThrow(/non-positive residue/);
  });
});
