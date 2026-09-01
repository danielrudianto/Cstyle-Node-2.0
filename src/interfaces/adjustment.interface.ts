/**
 * Satu baris penyesuaian stok.
 *
 * `quantity` BOLEH NEGATIF — itu justru intinya. Positif berarti stok
 * ditambahkan (barang ketemu, hasil opname lebih), negatif berarti dikurangi
 * (barang hilang, rusak). Nilai nol ditolak controller.
 */
export interface IAdjustmentItem {
  itemID: any;
  quantity: number;
}

/** Bentuk data penyesuaian stok, mengikuti koleksi `adjustment-events`. */
export interface IAdjustment {
  _id?: string;
  name?: string;
  date: Date;
  createdBy: any;
  createdAt?: Date;
  items: IAdjustmentItem[];
  /** null berarti gudang pusat, bukan "tidak ada toko". */
  storeID: any;
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;
}

/** Masukan pencarian penyesuaian stok. */
export interface IAdjustmentFetch {
  page: number;
  keyword: string;
  status: string[];
  /** 1 - 12; controller sudah menambahkan satu dari bulan gaya JavaScript. */
  month: number;
  year: number;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "AdjustmentInterface\|AdjustmentItemInterface" src
 */
export type AdjustmentInterface = IAdjustment;
export type AdjustmentItemInterface = IAdjustmentItem;
