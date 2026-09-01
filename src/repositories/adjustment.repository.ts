import { Connection } from "mongoose";
import {
  IAdjustment,
  IAdjustmentFetch,
} from "../interfaces/adjustment.interface";
import { AdjustmentModel } from "../models/adjustment.model";
import { monthFilter } from "../utils/period.helper";

/**
 * Semua akses database untuk penyesuaian stok.
 *
 * Penyesuaian adalah satu-satunya cara menambah stok TANPA penerimaan barang —
 * dan itu berarti stok yang masuk lewat sini punya harga pokok NOL. Lihat
 * adjustment-event.controller.ts: baris positif membuat stock-in dengan
 * `price: 0`. Jadi barang yang masuk lewat penyesuaian akan menurunkan
 * rata-rata harga pokok saat terjual nanti.
 *
 * Nomor dokumennya memakai `count + 1` pada bulan yang sama, dan `name` di
 * koleksinya BERTANDA unique — jadi dua penyesuaian yang dibuat bersamaan akan
 * bentrok dan yang kedua gagal dengan galat kunci ganda. Terlihat, bukan
 * hilang diam-diam seperti nota kasir.
 */
export class AdjustmentRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("adjustment-event");
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

  create(data: IAdjustment) {
    return this.collection.create({
      date: data.date,
      name: data.name,
      createdBy: data.createdBy,
      createdAt: new Date(),
      items: data.items,
      storeID: data.storeID,
    });
  }

  async fetch(
    data: IAdjustmentFetch
  ): Promise<{ data: AdjustmentModel[]; count: number }> {
    try {
      const filter = [];
      if (data.status.includes("active")) filter.push({ isDelete: false });
      if (data.status.includes("deleted")) filter.push({ isDelete: true });

      const query = {
        $or: filter,
        name: RegExp(data.keyword, "i"),
        ...this.periodFilter(data.month, data.year),
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(query)
          .populate("storeID", "name")
          .populate("createdBy", "name")
          .sort({ createdAt: -1 })
          .limit(20)
          .skip(20 * (data.page - 1)),
        this.collection.countDocuments(query),
      ]);

      return {
        data: rows.map((row) => AdjustmentModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching adjustment: ${error}`);
      throw error;
    }
  }

  fetchByID(id: string) {
    return this.collection
      .findById(id)
      .populate("createdBy", "name")
      .populate("deletedBy", "name")
      .populate("storeID", "name")
      .populate("items.itemID", "reference description");
  }

  delete(id: string, userID: string) {
    return this.collection.findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  /** Nomor berikutnya, disusun dari jumlah penyesuaian pada bulan yang sama. */
  async generateName(date: Date): Promise<string> {
    const count = await this.collection.countDocuments(
      this.periodFilter(date.getMonth() + 1, date.getFullYear())
    );

    return `ADJ-${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${(count + 1).toString().padStart(4, "0")}`;
  }
}

export default AdjustmentRepository;
