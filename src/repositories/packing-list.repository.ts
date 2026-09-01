import { Connection } from "mongoose";
import {
  IPackingList,
  IPackingListFetch,
  PackingListStatus,
} from "../interfaces/packing-list.interface";
import { PackingListModel } from "../models/packing-list.model";
import { monthFilter } from "../utils/period.helper";

/**
 * Semua akses database untuk packing list.
 *
 * Packing list adalah dokumen penyerahan barang langsung: barang keluar
 * gudang dan fakturnya dibuat pada saat yang sama. Bandingkan dengan surat
 * jalan, di mana barang dikirim dulu dan fakturnya menyusul.
 *
 * Penomorannya memakai `count + 1` pada bulan yang sama dan `name` TIDAK
 * bertanda unique, jadi dua packing list yang dibuat bersamaan bisa mendapat
 * nomor kembar tanpa ada yang menahannya.
 */
export class PackingListRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("packing-lists");
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

  create(data: IPackingList) {
    return this.collection.create({
      name: data.name,
      date: data.date,
      note: data.note,
      customerID: data.customerID,
      salesID: data.salesID,
      items: data.items,
      createdBy: data.createdBy,
      createdAt: new Date(),
    });
  }

  async fetch(
    data: IPackingListFetch
  ): Promise<{ data: PackingListModel[]; count: number }> {
    try {
      const filters = [];
      if (data.status.includes(PackingListStatus.Active)) {
        filters.push({ isDelete: false });
      }
      if (data.status.includes(PackingListStatus.Deleted)) {
        filters.push({ isDelete: true });
      }

      const filter = {
        $or: filters,
        name: { $regex: data.keyword, $options: "i" },
        ...this.periodFilter(data.month, data.year),
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(filter)
          .populate("customerID")
          .populate("salesID", "name")
          .populate("createdBy", "name")
          .populate("deletedBy", "name")
          .limit(20)
          .skip((data.page - 1) * 20)
          /* Kode lama memanggil .sort() dua kali; yang terakhir yang berlaku. */
          .sort({ date: -1 }),
        this.collection.countDocuments(filter),
      ]);

      return {
        data: rows.map((row) => PackingListModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching packing list: ${error}`);
      throw error;
    }
  }

  fetchByID(id: string) {
    return this.collection
      .findById(id)
      .populate("items.itemID")
      .populate("customerID", "name address phoneNumber")
      .populate("salesID", "name");
  }

  delete(id: string, userID: string) {
    return this.collection.findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  /** Nomor berikutnya, disusun dari jumlah packing list pada bulan yang sama. */
  async generateName(date: Date): Promise<string> {
    const count = await this.collection.countDocuments(
      this.periodFilter(date.getMonth() + 1, date.getFullYear())
    );

    return (
      "PL-CS-" +
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      (count + 1).toString().padStart(4, "0")
    );
  }
}

export default PackingListRepository;
