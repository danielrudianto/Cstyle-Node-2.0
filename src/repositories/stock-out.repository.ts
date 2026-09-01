import { Connection, Types } from "mongoose";
import {
  RemoveStockOutInterface,
  StockOutInterface,
} from "../interfaces/stock-out.interface";

/**
 * Akses database untuk stock-out — barang KELUAR.
 *
 * Setiap baris menunjuk satu baris stock-in lewat `stockInID`. Rantai itulah
 * yang membuat harga pokok bisa ditelusuri: harga sebuah penjualan diambil
 * dari stock-in yang dipakainya, bukan dari rata-rata. Satu penjualan bisa
 * menghasilkan BEBERAPA baris stock-out kalau sisanya harus diambil dari
 * lebih dari satu stock-in.
 *
 * TIDAK ADA INDEKS selain _id. fetchProductReport() menyaring berdasarkan
 * `date` lalu menyambung ke stock-ins, jadi tanpa indeks pada `date` seluruh
 * koleksi dipindai setiap kali laporan dibuka.
 */
export class StockOutRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("stock-outs");
  }

  create(data: StockOutInterface) {
    if (data.stockInID == undefined) {
      throw new Error("StockInID not found");
    }

    return this.collection.create({
      date: data.date,
      itemID: data.itemID,
      billID: data.billID,
      adjustmentEventID: data.adjustmentEventID,
      invoiceID: data.invoiceID,
      quantity: data.quantity,
      stockInID: data.stockInID,
    });
  }

  fetchByStockInID(stockInID: string) {
    return this.collection.find({ stockInID: stockInID });
  }

  /** Baris stock-out milik satu dokumen, disertai stock-in asalnya. */
  fetchForDeletion(data: RemoveStockOutInterface) {
    return this.collection.aggregate([
      {
        $lookup: {
          from: "stock-ins",
          localField: "stockInID",
          foreignField: "_id",
          as: "stockIn",
        },
      },
      { $unwind: { path: "$stockIn" } },
      {
        $match: {
          billID: data.billID == null ? null : new Types.ObjectId(data.billID),
          invoiceID:
            data.invoiceID == null ? null : new Types.ObjectId(data.invoiceID),
          adjustmentEventID:
            data.adjustmentCaseID == null
              ? null
              : new Types.ObjectId(data.adjustmentCaseID),
          "stockIn.itemID": new Types.ObjectId(data.itemID),
        },
      },
    ]);
  }

  /**
   * Seluruh barang keluar dalam satu bulan, disertai stock-in asalnya.
   *
   * Inilah sumber angka harga pokok pada laporan penjualan per produk.
   */
  fetchProductReport(month: number, year: number) {
    return this.collection.aggregate([
      {
        $match: {
          $and: [
            { date: { $gte: new Date(year, month - 1, 1) } },
            { date: { $lt: new Date(year, month, 1) } },
          ],
        },
      },
      {
        $lookup: {
          from: "stock-ins",
          localField: "stockInID",
          foreignField: "_id",
          as: "stockIn",
        },
      },
      { $unwind: { path: "$stockIn" } },
    ]);
  }

  deleteByID(id: string) {
    return this.collection.findByIdAndDelete(id);
  }
}

export default StockOutRepository;
