/**
 * Satu baris kartu stok: catatan pergerakan barang.
 *
 * Positif berarti masuk, negatif berarti keluar. Kartu stok TIDAK dipakai
 * menghitung stok berjalan — itu tugas koleksi `stocks` — melainkan untuk
 * menelusuri riwayat.
 *
 * `storeID` ada di skema koleksinya sejak awal tapi tidak pernah diisi, jadi
 * seluruh baris lama bernilai null dan riwayatnya tidak bisa dipisah per toko.
 * Sekarang diisi untuk baris baru.
 */
export interface StockCardInterface {
  id?: string;
  itemID: string;
  storeID?: string | null;
  quantity: number;
  billID: string | null;
  adjustmentEventID: string | null;
  goodReceiptID: string | null;
  invoiceID: string | null;
  deliverySlipID: string | null;
  stockInID?: string | null;
  date: Date;
}
