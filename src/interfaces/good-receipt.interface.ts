/**
 * Satu baris barang pada penerimaan barang.
 *
 * `discount` disimpan sebagai NILAI rupiah per satuan, bukan persen —
 * controller mengubahnya dari persen yang dikirim klien. Harga pokok yang
 * masuk ke stock-in dihitung dari harga setelah potongan itu.
 */
export interface IGoodReceiptItem {
  itemID: any;
  price: number;
  quantity: number;
  discount: number;
}

/** Bentuk data penerimaan barang, mengikuti koleksi `good-receipts`. */
export interface IGoodReceipt {
  _id?: string;
  /** Nomor dokumen; diketik pengguna, BUKAN dibuat sistem. */
  name: string;
  date: Date;
  supplierID: any;
  items: IGoodReceiptItem[];
  createdBy: any;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;
}

/** Masukan pencarian penerimaan barang. */
export interface IGoodReceiptSearch {
  keyword: string;
  page: number;
  /** 1 - 12; controller sudah menambahkan satu dari bulan gaya JavaScript. */
  month: number;
  year: number;
  status: GoodReceiptStatus[];
}

export enum GoodReceiptStatus {
  "Active" = "active",
  "Deleted" = "deleted",
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "GoodReceiptCreateInterface\|GoodReceiptItemInterface" src
 */
export type GoodReceiptCreateInterface = IGoodReceipt;
export type GoodReceiptItemInterface = IGoodReceiptItem;
