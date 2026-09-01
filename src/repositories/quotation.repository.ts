import moment from "moment";
import { Connection } from "mongoose";
import {
  IQuotation,
  IQuotationSearch,
  QuotationStatus,
} from "../interfaces/quotation.interface";
import { QuotationModel } from "../models/quotation.model";
import { monthFilter } from "../utils/period.helper";

/**
 * Semua akses database untuk penawaran.
 *
 * PENOMORAN BERBASIS HITUNGAN.
 *
 * Nomor penawaran disusun dari jumlah penawaran pada bulan yang sama
 * (`count + 1`), dan `name` pada koleksinya bertanda unique. Dua penawaran
 * yang dibuat bersamaan akan membaca hitungan yang sama lalu mencoba menulis
 * nomor yang sama — yang kedua GAGAL dengan galat kunci ganda.
 *
 * Itu mengganggu, tapi jauh lebih aman daripada jalur nota kasir, yang justru
 * MEMBUANG diam-diam saat nomornya bentrok. Di sini kegagalannya terlihat dan
 * pengguna tinggal mengulang.
 *
 * CACAT LAIN YANG DIPERTAHANKAN.
 *
 * search() membandingkan `expiryDate` — sebuah Date — dengan teks hasil
 * moment().format("YYYY-MM-DD"). MongoDB tidak mengecor teks menjadi tanggal
 * pada operator perbandingan, jadi penyaring aktif/kedaluwarsa itu tidak
 * bekerja sebagaimana mestinya.
 */
export class QuotationRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("quotations");
  }

  create(data: IQuotation) {
    return this.collection.create({
      date: data.date,
      expiryDate: data.expiryDate,
      name: data.name,
      customerID: data.customerID,
      note: data.note,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      items: data.items,
    });
  }

  /** Penyaring status: aktif, kedaluwarsa, dan dibatalkan. */
  private statusFilter(status: QuotationStatus[]) {
    const filters = [];
    const hariIni = moment(new Date()).format("YYYY-MM-DD");

    if (status.includes(QuotationStatus.Active)) {
      filters.push({ isDelete: false, expiryDate: { $gte: hariIni } });
    }

    if (status.includes(QuotationStatus.Expired)) {
      filters.push({ isDelete: false, expiryDate: { $lt: hariIni } });
    }

    if (status.includes(QuotationStatus.Canceled)) {
      filters.push({ isDelete: true });
    }

    return filters;
  }

  /**
   * Pencarian berhalaman, disaring bulan dan tahun.
   *
   * Penyaring bulannya berupa rentang tanggal UTC, jadi bisa memakai indeks —
   * penjelasannya di utils/period.helper.ts.
   */
  async search(
    data: IQuotationSearch
  ): Promise<{ data: QuotationModel[]; count: number }> {
    try {
      const filter = {
        name: { $regex: new RegExp(data.keyword, "i") },
        $or: this.statusFilter(data.status),
        ...monthFilter("date", data.month, data.year),
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(filter)
          .sort({ date: 1 })
          .select("date name expiryDate createdAt isDelete")
          .populate("customerID", "name")
          .populate("createdBy", "name")
          .populate("deletedBy", "name")
          .limit(20)
          .skip((data.page - 1) * 20),
        this.collection.countDocuments(filter),
      ]);

      return {
        data: rows.map((row) => QuotationModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on searching quotation: ${error}`);
      throw error;
    }
  }

  /** Satu penawaran lengkap dengan pelanggan dan barangnya. */
  fetchByID(id: string) {
    return this.collection
      .findById(id)
      .populate("customerID")
      .populate("items.itemID", "reference description")
      .populate("createdBy", "name")
      .populate("deletedBy", "name");
  }

  /**
   * Jumlah penawaran pada satu bulan, dipakai menyusun nomor berikutnya.
   *
   * TIDAK menyaring `isDelete`, jadi penawaran yang dibatalkan tetap ikut
   * terhitung — itu memang yang diinginkan, supaya nomornya tidak dipakai
   * ulang.
   */
  countByMonthYear(month: number, year: number): Promise<number> {
    return this.collection.countDocuments(
      monthFilter("date", month, year)
    );
  }

  /** Pembatalan, bukan penghapusan sungguhan. */
  delete(id: string, userID: string) {
    return this.collection.findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }
}

export default QuotationRepository;
