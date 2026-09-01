import { Connection } from "mongoose";
import {
  GoodReceiptStatus,
  IGoodReceipt,
  IGoodReceiptSearch,
} from "../interfaces/good-receipt.interface";
import { GoodReceiptModel } from "../models/good-receipt.model";
import { monthFilter } from "../utils/period.helper";

/**
 * Semua akses database untuk penerimaan barang.
 *
 * Ini SATU-SATUNYA pintu masuk barang ke sistem. Setiap baris di sini pada
 * akhirnya melahirkan satu baris `stock-ins`, dan harga pada baris itulah yang
 * menjadi dasar seluruh perhitungan harga pokok. Salah di sini berarti salah
 * di seluruh laporan HPP.
 *
 * CATATAN NAMA KOLEKSI.
 *
 * Model didaftarkan dengan nama "good-receipt" (tunggal) di
 * utils/database.helper.ts, dan Mongoose menurunkan nama koleksinya menjadi
 * `good-receipts` (jamak). Keduanya benar dan konsisten — berbeda dari surat
 * jalan, yang nama modelnya memang salah ketik. Kalau memeriksa data langsung
 * lewat mongosh, pakai nama JAMAK.
 *
 * Nomor dokumennya DIKETIK PENGGUNA, bukan dibuat sistem, dan tidak ada indeks
 * unique pada `name`. Jadi nomor ganda mungkin terjadi dan tidak ada yang
 * menahannya.
 */
export class GoodReceiptRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("good-receipt");
  }

  /**
   * Penyaring bulan yang BISA memakai indeks.
   *
   * Bentuk sebelumnya memakai $expr dengan $month/$year, yang memaksa
   * MongoDB menghitung bulan tiap dokumen dan membuat indeks tidak
   * terpakai. Rentang tanggal di UTC memberi hasil yang sama persis —
   * penjelasannya di utils/period.helper.ts.
   */
  private periodFilter(month: number, year: number) {
    return monthFilter("date", month, year);
  }

  create(data: IGoodReceipt) {
    return this.collection.create({
      name: data.name,
      date: data.date,
      supplierID: data.supplierID,
      items: data.items,
      createdBy: data.createdBy,
      createdAt: new Date(),
    });
  }

  /**
   * Mengganti isi dokumen.
   *
   * `createdBy` sengaja TIDAK ikut diperbarui, berbeda dari beberapa domain
   * lain yang keliru menimpanya saat penyuntingan.
   */
  update(data: IGoodReceipt) {
    return this.collection.findByIdAndUpdate(data._id, {
      name: data.name,
      date: data.date,
      supplierID: data.supplierID,
      items: data.items,
    });
  }

  fetchByID(id: string) {
    return this.collection
      .findById(id)
      .populate("items.itemID", "reference description")
      .populate("supplierID", "name address");
  }

  async fetch(
    data: IGoodReceiptSearch
  ): Promise<{ data: GoodReceiptModel[]; count: number }> {
    try {
      const filters = [];
      if (data.status.includes(GoodReceiptStatus.Active)) {
        filters.push({ isDelete: false });
      }
      if (data.status.includes(GoodReceiptStatus.Deleted)) {
        filters.push({ isDelete: true });
      }

      const filter = {
        name: { $regex: new RegExp(data.keyword, "i") },
        $or: filters,
        ...this.periodFilter(data.month, data.year),
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(filter)
          .sort({ date: 1 })
          .select("date name createdAt isDelete")
          .populate("supplierID", "name")
          .populate("createdBy", "name")
          .populate("deletedBy", "name")
          .limit(20)
          .skip((data.page - 1) * 20),
        this.collection.countDocuments(filter),
      ]);

      return {
        data: rows.map((row) => GoodReceiptModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching good receipt: ${error}`);
      throw error;
    }
  }

  /**
   * Penerimaan barang satu bulan untuk laporan pembelian.
   *
   * `isDelete` dulu ikut diperiksa DI DALAM $expr, yang menyeret seluruh
   * penyaring keluar dari jangkauan indeks. Sekarang keduanya penyaring biasa.
   */
  fetchReport(month: number, year: number) {
    return this.collection
      .find({
        ...this.periodFilter(month, year),
        isDelete: false,
      })
      .populate("supplierID", "name")
      .populate("createdBy", "name")
      .sort({ date: 1 });
  }

  /** Sama seperti fetchReport(), tapi beserta detail barangnya. */
  fetchProductReport(month: number, year: number) {
    return this.collection
      .find({
        ...this.periodFilter(month, year),
        isDelete: false,
      })
      .populate("supplierID", "name")
      .populate("items.itemID", "reference description");
  }

  delete(id: string, userID: string) {
    return this.collection.findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }
}

export default GoodReceiptRepository;
