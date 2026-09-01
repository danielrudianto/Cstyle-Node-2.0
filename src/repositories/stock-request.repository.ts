import { Connection } from "mongoose";
import {
  IStockRequest,
  IStockRequestFetch,
  IStockRequestSend,
} from "../interfaces/stock-request.interface";
import { StockRequestModel } from "../models/stock-request.model";
import { monthFilter } from "../utils/period.helper";

/**
 * Semua akses database untuk permintaan transfer stok.
 *
 * Arah `requestFrom` dan `requestTo` mudah tertukar — penjelasannya ada di
 * interfaces/stock-request.interface.ts. Ringkasnya: barang bergerak dari
 * `requestTo` ke `requestFrom`.
 *
 * PENYARINGNYA MEMAKAI `createdAt`, BUKAN `date`.
 *
 * Berbeda dari seluruh domain dokumen lain yang menyaring berdasarkan `date`,
 * pencarian di sini memakai `createdAt`. Jadi permintaan yang tanggal
 * dokumennya bulan lalu tapi dibuat bulan ini akan muncul di bulan ini.
 * Dipertahankan apa adanya.
 *
 * CACAT LAIN YANG DIPERTAHANKAN.
 *
 *   - fetchUnsent() memakai penyaring BERBEDA untuk daftar dan penghitungnya:
 *     daftarnya menyaring isConfirm dan isReject, penghitungnya tidak. Jadi
 *     jumlah total lebih besar daripada isi daftarnya.
 *
 *   - `name` bertanda unique dan disusun dari `count + 1` pada bulan yang
 *     sama, jadi dua permintaan yang dibuat bersamaan bentrok — yang kedua
 *     gagal dengan galat kunci ganda.
 */
export class StockRequestRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("stock-requests");
  }

  /**
   * Penyaring bulan yang BISA memakai indeks — memakai `createdAt`,
   * bukan `date`. Lihat catatan di atas kelas.
   *
   * Bentuk sebelumnya memakai $expr dengan $month/$year, yang memaksa
   * MongoDB menghitung bulan tiap dokumen dan membuat indeks tidak
   * terpakai. Rentang tanggal di UTC memberi hasil yang sama persis —
   * penjelasannya di utils/period.helper.ts.
   */
  private periodFilter(month: number, year: number) {
    return monthFilter("createdAt", month, year);
  }

  create(data: IStockRequest) {
    return this.collection.create({
      name: data.name,
      date: data.date,
      items: data.items,
      note: data.note,
      createdBy: data.createdBy,
      createdAt: new Date(),
      requestFrom: data.requestFrom,
      requestTo: data.requestTo,
      isSending: false,
      isConfirm: false,
      isReject: false,
      isDelete: false,
      rejectNote: null,
    });
  }

  async fetch(
    data: IStockRequestFetch
  ): Promise<{ data: StockRequestModel[]; count: number }> {
    try {
      const filter = [];

      if (data.status.includes("active")) filter.push({ isDelete: false });
      if (data.status.includes("deleted")) filter.push({ isDelete: true });
      if (data.status.includes("sending")) {
        filter.push({ isDelete: false, isSending: true });
      }
      if (data.status.includes("rejected")) {
        filter.push({ isDelete: false, isReject: true });
      }
      if (data.status.includes("received")) {
        filter.push({ isDelete: false, isConfirm: true });
      }

      const query = {
        $or: [...filter],
        ...this.periodFilter(data.month, data.year),
        name: { $regex: RegExp(data.keyword, "i") },
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(query)
          .populate("requestFrom", "name address")
          .populate("requestTo", "name address")
          .populate("createdBy", "name")
          .skip((data.page - 1) * 10)
          .limit(10)
          .sort({ createdAt: -1 }),
        this.collection.countDocuments(query),
      ]);

      return {
        data: rows.map((row) => StockRequestModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching stock request: ${error}`);
      throw error;
    }
  }

  /** Permintaan yang belum diproses, dari sisi mana pun toko itu berdiri. */
  async fetchCreated(
    page: number,
    storeID: string
  ): Promise<{ data: StockRequestModel[]; count: number }> {
    const filter = {
      isDelete: false,
      isSending: false,
      isConfirm: false,
      isReject: false,
      $or: [{ requestFrom: storeID }, { requestTo: storeID }],
    };

    const [rows, count] = await Promise.all([
      this.collection
        .find(filter)
        .populate("requestFrom", "name address")
        .populate("requestTo", "name address")
        .populate("createdBy", "name")
        .select("name createdAt requestFrom requestTo createdBy")
        .limit(10)
        .skip((page - 1) * 10)
        .sort({ createdAt: -1 }),
      this.collection.countDocuments(filter),
    ]);

    return {
      data: rows.map((row) => StockRequestModel.fromMap(row)),
      count: count,
    };
  }

  fetchByID(id: string) {
    return this.collection
      .findById(id)
      .populate("createdBy", "name")
      .populate("requestFrom", "name address")
      .populate("requestTo", "name address")
      .populate("sendBy", "name")
      .populate("deletedBy", "name")
      .populate("updatedBy", "name")
      .populate("items.itemID", "reference description");
  }

  /**
   * Permintaan yang ditujukan ke toko ini dan BELUM dikirim.
   *
   * Penghitungnya sengaja memakai penyaring yang lebih longgar daripada
   * daftarnya — lihat catatan di atas kelas.
   */
  async fetchUnsent(
    page: number,
    storeID: string | null
  ): Promise<{ data: StockRequestModel[]; count: number }> {
    const [rows, count] = await Promise.all([
      this.collection
        .find({
          isDelete: false,
          isSending: false,
          requestTo: storeID,
          isConfirm: false,
          isReject: false,
        })
        .populate("requestFrom", "name address")
        .populate("requestTo", "name address")
        .populate("createdBy", "name")
        .select("_id name createdAt requestFrom requestTo createdBy")
        .limit(10)
        .skip((page - 1) * 10)
        .sort({ createdAt: -1 }),
      this.collection.countDocuments({
        isDelete: false,
        isSending: false,
        requestTo: storeID,
      }),
    ]);

    return {
      data: rows.map((row) => StockRequestModel.fromMap(row)),
      count: count,
    };
  }

  /** Permintaan dari toko ini yang sudah dikirim tapi belum diterima. */
  async fetchUnreceived(
    page: number,
    storeID: string | null
  ): Promise<{ data: StockRequestModel[]; count: number }> {
    const filter = {
      isDelete: false,
      requestFrom: storeID,
      isSending: true,
      isConfirm: false,
      isReject: false,
    };

    const [rows, count] = await Promise.all([
      this.collection
        .find(filter)
        .populate("requestFrom", "name address")
        .populate("requestTo", "name address")
        .populate("createdBy", "name")
        .select("name createdAt requestFrom requestTo createdBy")
        .limit(10)
        .skip((page - 1) * 10)
        .sort({ createdAt: -1 }),
      this.collection.countDocuments(filter),
    ]);

    return {
      data: rows.map((row) => StockRequestModel.fromMap(row)),
      count: count,
    };
  }

  /**
   * Menandai permintaan sudah dikirim, sekaligus MENGGANTI isi barangnya.
   *
   * Toko pengirim boleh mengurangi jumlah dari yang diminta, jadi `items` yang
   * masuk di sini menimpa daftar aslinya.
   */
  send(data: IStockRequestSend) {
    return this.collection
      .findByIdAndUpdate(data.id, {
        items: data.items,
        isSending: true,
        updatedBy: data.createdBy,
        updatedAt: new Date(),
      })
      .populate("requestFrom", "name address")
      .populate("requestTo", "name address")
      .populate("createdBy", "name")
      .populate("sendBy", "name")
      .populate("deletedBy", "name")
      .populate("updatedBy", "name")
      .populate("items.itemID", "reference description");
  }

  confirm(id: string, userID: string) {
    return this.collection.findByIdAndUpdate(id, {
      isConfirm: true,
      updatedBy: userID,
      updatedAt: new Date(),
    });
  }

  reject(id: string, userID: string, note: string) {
    return this.collection.findByIdAndUpdate(id, {
      isReject: true,
      updatedBy: userID,
      updatedAt: new Date(),
      rejectNote: note,
    });
  }

  delete(id: string, userID: string) {
    return this.collection.findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  /** Jumlah permintaan pada satu bulan, dipakai menyusun nomor berikutnya. */
  countByMonthYear(month: number, year: number): Promise<number> {
    return this.collection.countDocuments(this.periodFilter(month, year));
  }
}

export default StockRequestRepository;
