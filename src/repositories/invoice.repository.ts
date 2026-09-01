import { Connection } from "mongoose";
import {
  IInvoice,
  IInvoiceFetch,
  IInvoicePayment,
  IInvoiceVisibility,
} from "../interfaces/invoice.interface";
import { InvoiceModel } from "../models/invoice.model";
import { monthFilter } from "../utils/period.helper";

/**
 * Semua akses database untuk faktur penjualan.
 *
 * Faktur selalu lahir dari salah satu dari dua dokumen: packing list (barang
 * langsung diserahkan) atau surat jalan (barang dikirim dulu). Karena itu
 * `packingListID` dan `deliverySlipID` tidak pernah terisi bersamaan, dan
 * pemanggil harus selalu memeriksa yang mana yang ada.
 *
 * CACAT YANG DIPERTAHANKAN.
 *
 *   - updatePayment() MENIMPA seluruh larik `payments` dengan satu elemen,
 *     bukan menambahkan. Jadi pembayaran cicilan tidak mungkin: pembayaran
 *     kedua menghapus catatan pembayaran pertama, sementara `isPaid` tetap
 *     true. Kalau cicilan memang dibutuhkan, ini yang harus diubah dulu.
 *
 *   - Penomoran memakai `count + 1` pada bulan yang sama, dan tidak ada
 *     indeks unique pada `invoices.name` — jadi dua faktur yang dibuat
 *     bersamaan bisa benar-benar mendapat nomor KEMBAR, dan tidak ada yang
 *     menahannya. Berbeda dari penawaran dan nota, yang setidaknya gagal
 *     dengan galat kunci ganda.
 */
export class InvoiceRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("invoices");
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

  create(data: IInvoice) {
    return this.collection.create({
      name: data.name,
      date: data.date,
      note: data.note,
      dueDate: data.dueDate,
      packingListID: data.packingListID,
      deliverySlipID: data.deliverySlipID,
      createdBy: data.createdBy,
      createdAt: new Date(),
      customerID: data.customerID,
      salesID: data.salesID,
    });
  }

  async fetch(
    data: IInvoiceFetch
  ): Promise<{ data: InvoiceModel[]; count: number }> {
    try {
      const filters = [];
      const paymentFilters = [];

      if (data.status.includes("active")) filters.push({ isDelete: false });
      if (data.status.includes("deleted")) filters.push({ isDelete: true });

      if (data.paymentStatus.includes("paid")) {
        paymentFilters.push({ isPaid: true });
      }
      if (data.paymentStatus.includes("unpaid")) {
        paymentFilters.push({ isPaid: false });
      }

      const filter = {
        $and: [{ $or: filters }, { $or: paymentFilters }],
        ...this.periodFilter(data.month, data.year),
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(filter)
          .sort({ date: -1 })
          .populate("customerID", "name")
          .populate("salesID", "name")
          .populate("createdBy", "name")
          .limit(20)
          .skip(20 * (data.page - 1)),
        this.collection.countDocuments(filter),
      ]);

      return {
        data: rows.map((row) => InvoiceModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching invoice: ${error}`);
      throw error;
    }
  }

  /** Faktur satu bulan untuk laporan penjualan. */
  fetchReport(month: number, year: number, shownOnly: boolean = true) {
    const query: any = this.periodFilter(month, year);
    if (shownOnly) {
      query.isHidden = false;
    }

    return this.collection
      .find(query)
      .populate("customerID", "name")
      .populate("salesID", "name")
      .populate("createdBy", "name")
      .populate("packingListID");
  }

  /**
   * Faktur satu bulan beserta seluruh barangnya, untuk laporan per produk.
   *
   * Barangnya bisa berada di packing list ATAU di surat jalan, jadi keduanya
   * ikut di-populate sampai ke jenis barangnya.
   */
  fetchProductReport(month: number, year: number, shownOnly: boolean = true) {
    const query: any = this.periodFilter(month, year);
    if (shownOnly) {
      query.isHidden = false;
    }

    const populateItems = {
      path: "items.itemID",
      model: "items",
      select: "reference description _id itemTypeID",
      populate: { path: "itemTypeID", select: "name" },
    };

    return this.collection
      .find(query)
      .populate({ path: "packingListID", populate: populateItems })
      .populate({ path: "deliverySlipID", populate: populateItems })
      .populate("packingListID.customerID", "name")
      .populate("deliverySlipID.customerID", "name")
      .populate("createdBy", "name");
  }

  fetchByID(id: string) {
    return this.collection
      .findById(id)
      .populate("customerID", "name address phoneNumber")
      .populate("salesID", "name")
      .populate("createdBy", "name")
      .populate("packingListID")
      .populate("deliverySlipID");
  }

  fetchByPackingListID(id: string) {
    return this.collection.findOne({ packingListID: id });
  }

  fetchByDeliverySlipID(id: string) {
    return this.collection.findOne({ deliverySlipID: id });
  }

  /** MENIMPA larik pembayaran, bukan menambah — lihat catatan di atas. */
  updatePayment(data: IInvoicePayment) {
    return this.collection.findByIdAndUpdate(data.id, {
      payments: [
        {
          paidAt: data.paidAt,
          paidBy: data.paidBy,
          paymentMethod: data.paymentMethod,
          amount: data.amount,
        },
      ],
      isPaid: true,
    });
  }

  deletePayment(id: string) {
    return this.collection.findByIdAndUpdate(id, {
      isPaid: false,
      payments: [],
    });
  }

  /** Menyembunyikan atau memunculkan kembali faktur pada laporan. */
  updateVisibility(data: IInvoiceVisibility[]) {
    return Promise.all(
      data.map((item) =>
        this.collection.findByIdAndUpdate(item.id, {
          isHidden: item.isHidden,
        })
      )
    );
  }

  delete(id: string, userID: string) {
    return this.collection.findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  /**
   * Menyusun nomor faktur berikutnya dari jumlah faktur pada bulan yang sama.
   *
   * TIDAK ADA indeks unique pada `name`, jadi nomor kembar benar-benar bisa
   * tersimpan kalau dua faktur dibuat bersamaan — lihat catatan di atas.
   */
  async generateName(date: Date): Promise<string> {
    const count = await this.collection.countDocuments(
      this.periodFilter(date.getMonth() + 1, date.getFullYear())
    );

    return (
      "INV-CS-" +
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      (count + 1).toString().padStart(4, "0")
    );
  }
}

export default InvoiceRepository;
