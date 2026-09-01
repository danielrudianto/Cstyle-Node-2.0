import { Connection } from "mongoose";
import { StockInInterface } from "../interfaces/stock-in.interface";
import { RemoveStockInInterface } from "../interfaces/stock-out.interface";
import { IDeleteStockIn } from "../interfaces/stock.interface";

/**
 * Akses database untuk stock-in — barang MASUK.
 *
 * Setiap baris menyimpan `quantity` (jumlah saat masuk) dan `residue` (sisa
 * yang belum terpakai). Perbedaan keduanya adalah inti perhitungan HPP:
 * harga pokok diambil dari `price` pada baris stock-in yang dipakai, bukan
 * dari harga rata-rata. Baris yang residue-nya sudah nol berarti habis
 * terpakai.
 *
 * TIDAK ADA INDEKS pada koleksi ini selain _id. fetchFifo() menyaring dengan
 * itemID + residue lalu mengurutkan berdasarkan date, jadi setiap
 * pemanggilannya memindai seluruh koleksi. Karena fetchFifo() dipanggil di
 * dalam perulangan — sekali per putaran, per barang, per nota — biayanya
 * berlipat dengan cepat.
 */
export class StockInRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("stock-ins");
  }

  create(data: StockInInterface) {
    return this.collection.create({
      date: data.date,
      itemID: data.itemID,
      quantity: data.quantity,
      residue: data.residue,
      price: data.price,
      goodReceiptID: data.goodReceiptID,
      adjustmentEventID: data.adjustmentEventID,
      storeID: data.storeID,
    });
  }

  /**
   * Baris stock-in tertua yang masih punya sisa — dasar urutan FIFO.
   *
   * CATATAN: penyaringnya TIDAK memakai storeID, padahal stock-in menyimpan
   * kolom itu. Artinya barang yang keluar di satu toko bisa mengonsumsi sisa
   * stok milik toko lain, dan harga pokok yang terpakai ikut berasal dari
   * toko yang salah. Ini perilaku lama yang dipertahankan.
   */
  fetchFifo(itemID: string) {
    return this.collection
      .findOne({
        itemID: itemID,
        residue: { $gt: 0 },
      })
      .sort({ date: 1 });
  }

  fetchForDeletion(data: RemoveStockInInterface) {
    return this.collection.findOne({
      itemID: data.itemID,
      goodReceiptID: data.goodReceiptID,
      adjustmentEventID: data.adjustmentCaseID,
    });
  }

  /**
   * Mengurangi sisa sebanyak `decr`.
   *
   * Nilai negatif MENAMBAH sisa — itu dipakai saat pembatalan stock-out.
   */
  updateResidue(stockInID: string, decr: number) {
    return this.collection.findByIdAndUpdate(stockInID, {
      $inc: { residue: -1 * decr },
    });
  }

  delete(data: IDeleteStockIn) {
    return this.collection.findOneAndDelete({
      goodReceiptID: data.goodReceiptID,
      adjustmentEventID: data.adjustmentEventID,
      itemID: data.itemID,
    });
  }
}

export default StockInRepository;
