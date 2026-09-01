import { BillModel } from "../../src/models/bill.model";
import { CustomerModel } from "../../src/models/customer.model";
import { GoodReceiptModel } from "../../src/models/good-receipt.model";
import { PackingListModel } from "../../src/models/packing-list.model";

/**
 * Uji perhitungan dan pemetaan pada lapisan model.
 *
 * Model sekarang berisi data dan perhitungan murni — tanpa akses database —
 * jadi seluruhnya bisa diuji langsung tanpa persiapan apa pun.
 */

describe("PackingListModel.mergeItems", () => {
  const baris = (over: Partial<any> = {}) => ({
    itemID: "A",
    quantity: 1,
    price: 1000,
    discount: 0,
    ...over,
  });

  it("menggabungkan baris yang barang, harga, dan diskonnya sama", () => {
    const hasil = PackingListModel.mergeItems([
      baris({ quantity: 2 }),
      baris({ quantity: 3 }),
    ]);

    expect(hasil).toHaveLength(1);
    expect(hasil[0].quantity).toBe(5);
  });

  it("TIDAK menggabungkan barang sama dengan harga berbeda", () => {
    /* Harga berbeda memang menjadi dua baris terpisah di faktur. */
    const hasil = PackingListModel.mergeItems([
      baris({ quantity: 2, price: 1000 }),
      baris({ quantity: 3, price: 1200 }),
    ]);

    expect(hasil).toHaveLength(2);
  });

  it("TIDAK menggabungkan barang sama dengan diskon berbeda", () => {
    const hasil = PackingListModel.mergeItems([
      baris({ quantity: 2, discount: 0 }),
      baris({ quantity: 3, discount: 10 }),
    ]);

    expect(hasil).toHaveLength(2);
  });

  it("tidak mengubah larik yang dikirim pemanggil", () => {
    const masukan = [baris({ quantity: 2 }), baris({ quantity: 3 })];
    PackingListModel.mergeItems(masukan);

    expect(masukan[0].quantity).toBe(2);
    expect(masukan[1].quantity).toBe(3);
  });

  it("larik kosong menghasilkan larik kosong", () => {
    expect(PackingListModel.mergeItems([])).toEqual([]);
  });
});

describe("BillModel.totalValue", () => {
  it("mengurangi potongan sebelum mengalikan jumlah", () => {
    const nilai = BillModel.totalValue([
      { itemID: "A", quantity: 2, price: 10000, discount: 1000, percentage: 10 },
    ] as any);

    /* (10000 - 1000) x 2 */
    expect(nilai).toBe(18000);
  });

  it("menjumlahkan seluruh baris", () => {
    const nilai = BillModel.totalValue([
      { itemID: "A", quantity: 1, price: 5000, discount: 0, percentage: 0 },
      { itemID: "B", quantity: 3, price: 2000, discount: 500, percentage: 25 },
    ] as any);

    expect(nilai).toBe(5000 + 4500);
  });

  it("nota tanpa baris bernilai nol", () => {
    expect(BillModel.totalValue([])).toBe(0);
  });
});

describe("GoodReceiptModel.netPrice", () => {
  it("menghitung harga setelah potongan persen", () => {
    expect(GoodReceiptModel.netPrice(10000, 10)).toBe(9000);
  });

  it("potongan nol berarti harga tidak berubah", () => {
    expect(GoodReceiptModel.netPrice(10000, 0)).toBe(10000);
  });

  it("inilah angka yang masuk ke stock-ins.price dan menjadi dasar HPP", () => {
    /* Penanda niat: kalau rumus ini berubah, seluruh laporan HPP ikut bergeser. */
    expect(GoodReceiptModel.netPrice(12500, 20)).toBe(10000);
  });
});

describe("fromMap", () => {
  it("mengubah ObjectId menjadi teks", () => {
    const model = CustomerModel.fromMap({
      _id: { toString: () => "abc123" },
      name: "Toko A",
      address: "Jl. X",
      type: "bulk",
      createdBy: { toString: () => "user1" },
    });

    expect(model._id).toBe("abc123");
    expect(model.createdBy).toBe("user1");
  });

  it("mengisi bidang opsional yang tidak ada dengan null, bukan undefined", () => {
    const model = CustomerModel.fromMap({
      _id: { toString: () => "abc123" },
      name: "Toko A",
      address: "Jl. X",
      type: "bulk",
    });

    expect(model.phoneNumber).toBeNull();
    expect(model.email).toBeNull();
    expect(model.npwp).toBeNull();
    expect(model.deletedAt).toBeNull();
  });

  it("TIDAK membawa __v — bidang internal Mongoose tidak dikirim ke klien", () => {
    const model = CustomerModel.fromMap({
      _id: { toString: () => "abc123" },
      name: "Toko A",
      address: "Jl. X",
      type: "bulk",
      __v: 7,
    });

    expect(model).not.toHaveProperty("__v");
  });
});
