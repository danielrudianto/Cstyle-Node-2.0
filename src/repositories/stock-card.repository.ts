import { Connection } from "mongoose";
import { StockCardInterface } from "../interfaces/stock-card.interface";

/**
 * Akses database untuk kartu stok.
 *
 * Kartu stok adalah catatan pergerakan: satu baris per mutasi, bertanda
 * positif untuk masuk dan negatif untuk keluar. Ia TIDAK dipakai menghitung
 * stok berjalan — itu tugas koleksi `stocks` — melainkan untuk menelusuri
 * riwayat.
 *
 * TIDAK ADA INDEKS selain _id, padahal koleksi ini yang paling cepat tumbuh:
 * satu baris untuk setiap pergerakan barang. Penelusuran berdasarkan itemID
 * atau tanggal memindai seluruh koleksi.
 */
export class StockCardRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("stock-cards");
  }

  create(data: StockCardInterface) {
    return this.collection.create({
      itemID: data.itemID,
      storeID: data.storeID ?? null,
      quantity: data.quantity,
      date: data.date,
      billID: data.billID,
      invoiceID: data.invoiceID,
      adjustmentEventID: data.adjustmentEventID,
      goodReceiptID: data.goodReceiptID,
      deliverySlipID: data.deliverySlipID,
      stockInID: data.stockInID ?? null,
    });
  }

  deleteByDeliverySlipID(id: string) {
    return this.collection.deleteMany({ deliverySlipID: id });
  }
}

export default StockCardRepository;
