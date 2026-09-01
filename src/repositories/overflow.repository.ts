import { Connection } from "mongoose";
import { OverflowInterface } from "../interfaces/overflow.interface";

/**
 * Akses database untuk overflow — barang keluar yang TIDAK punya stok.
 *
 * Kalau sebuah penjualan tidak menemukan stock-in bersisa, jumlahnya
 * disimpan di sini sebagai utang: barang sudah terjual tapi harga pokoknya
 * belum diketahui. Begitu barang masuk lagi, checkOverflow() memindahkannya
 * kembali menjadi stock-out sungguhan sehingga HPP-nya terisi.
 *
 * Baris yang menumpuk di sini berarti ada penjualan yang harga pokoknya belum
 * terhitung — jadi jumlah isinya adalah petunjuk langsung kalau laporan HPP
 * sedang tidak lengkap.
 */
export class OverflowRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("overflows");
  }

  create(data: OverflowInterface) {
    return this.collection.create({
      itemID: data.itemID,
      quantity: data.quantity,
      billID: data.billID,
      adjustmentEventID: data.adjustmentEventID,
      invoiceID: data.invoiceID,
    });
  }

  fetchAll() {
    return this.collection.find({});
  }

  deleteByID(id: string) {
    return this.collection.findByIdAndDelete(id);
  }
}

export default OverflowRepository;
