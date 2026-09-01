import { Connection } from "mongoose";
import {
  DeliverySlipFetchStatus,
  IDeliverySlip,
  IDeliverySlipFetch,
  IDeliverySlipReturn,
} from "../interfaces/delivery-slip.interface";
import { DeliverySlipModel } from "../models/delivery-slip.model";
import { monthFilter } from "../utils/period.helper";

/**
 * Semua akses database untuk surat jalan.
 *
 * ==================== NAMA KOLEKSI YANG SALAH ====================
 *
 * Kode lama memanggil conn.model("delivery-slip") — TANPA "s" — di hampir
 * seluruh metodenya, padahal yang didaftarkan di utils/database.helper.ts
 * adalah "delivery-slips". Mongoose melempar MissingSchemaError untuk model
 * yang belum terdaftar, jadi create(), fetch(), fetchByID(), deleteByID(),
 * dan generateName() SELALU gagal begitu dipanggil. Hanya update() yang
 * kebetulan menuliskan nama yang benar.
 *
 * Artinya fitur surat jalan tidak pernah bisa dipakai. Terpastikan di
 * produksi pada 1 September 2026: koleksi `delivery-slips` berisi NOL
 * dokumen.
 *
 * Nama modelnya diperbaiki di sini. Ini SATU-SATUNYA cara membuat berkas ini
 * berarti — mempertahankan salah ketiknya berarti mempertahankan fitur yang
 * mati total. Tapi konsekuensinya perlu disadari: jalur kode yang selama ini
 * tidak pernah berjalan kini menjadi hidup, dan jalur itu belum pernah teruji
 * di produksi. Uji surat jalan dari ujung ke ujung sebelum dirilis.
 * =================================================================
 */
export class DeliverySlipRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("delivery-slips");
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

  create(data: IDeliverySlip) {
    return this.collection.create({
      name: data.name,
      date: data.date,
      customerID: data.customerID,
      salesID: data.salesID,
      items: data.items,
      createdBy: data.createdBy,
      createdAt: new Date(),
    });
  }

  /** Daftar berhalaman, 10 baris per halaman. */
  async fetch(
    data: IDeliverySlipFetch
  ): Promise<{ data: DeliverySlipModel[]; count: number }> {
    try {
      const filter = [];

      if (data.status.includes(DeliverySlipFetchStatus.active)) {
        filter.push({ isDelete: false, isReturn: false });
      }

      if (data.status.includes(DeliverySlipFetchStatus.returned)) {
        filter.push({ isDelete: false, isReturn: true });
      }

      /*
        "Dibatalkan" disaring dengan deletedBy null, padahal deleteByID() SELALU
        mengisi deletedBy. Jadi penyaring ini tidak pernah cocok dengan apa pun.
        Dipertahankan apa adanya.
      */
      if (data.status.includes(DeliverySlipFetchStatus.canceled)) {
        filter.push({ isDelete: true, deletedBy: null });
      }

      const query = {
        $or: filter,
        ...this.periodFilter(data.month, data.year),
        name: RegExp(data.keyword, "i"),
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(query)
          .populate("customerID", "name")
          .populate("salesID", "name")
          .populate("createdBy", "name")
          .skip((data.page - 1) * 10)
          .limit(10),
        this.collection.countDocuments(query),
      ]);

      return {
        data: rows.map((row) => DeliverySlipModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching delivery slip: ${error}`);
      throw error;
    }
  }

  fetchByID(id: string) {
    return this.collection
      .findById(id)
      .populate("customerID", "name")
      .populate("salesID", "name")
      .populate("items.itemID", "reference description");
  }

  /**
   * Surat jalan yang barangnya belum kembali.
   *
   * CATATAN: penghitungnya memakai penyaring yang BERBEDA dari daftarnya —
   * `{ deletedBy: null }` alih-alih `{ isReturn: false, isDelete: false }` —
   * sehingga jumlah total tidak cocok dengan isi daftarnya. Dipertahankan.
   */
  async fetchUnconfirmed(
    page: number
  ): Promise<{ data: DeliverySlipModel[]; count: number }> {
    const [rows, count] = await Promise.all([
      this.collection
        .find({ isReturn: false, isDelete: false })
        .populate("customerID", "name")
        .skip((page - 1) * 10)
        .limit(10),
      this.collection.countDocuments({ deletedBy: null }),
    ]);

    return {
      data: rows.map((row) => DeliverySlipModel.fromMap(row)),
      count: count,
    };
  }

  /** Mencatat pengembalian barang: menandai isReturn dan mengisi `returned`. */
  async recordReturn(data: IDeliverySlipReturn) {
    const deliverySlip: any = await this.collection.findById(data.id);
    if (!deliverySlip) {
      throw new Error(`Delivery slip ${data.id} not found`);
    }

    deliverySlip.isReturn = true;
    deliverySlip.returnedAt = new Date();

    for (const item of data.items) {
      const index = deliverySlip.items.findIndex(
        (x: any) => x.id == item.id
      );

      if (index != -1) {
        deliverySlip.items[index].returned = item.return;
      }
    }

    await deliverySlip.save();
    return deliverySlip;
  }

  delete(id: string, userID: string) {
    return this.collection.findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  /** Nomor berikutnya, disusun dari jumlah surat jalan pada bulan yang sama. */
  async generateName(date: Date): Promise<string> {
    const count = await this.collection.countDocuments(
      this.periodFilter(date.getMonth() + 1, date.getFullYear())
    );

    return (
      "DS-CS-" +
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      (count + 1).toString().padStart(4, "0")
    );
  }
}

export default DeliverySlipRepository;
