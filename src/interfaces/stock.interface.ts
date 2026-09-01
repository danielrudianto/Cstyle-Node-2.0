/** Satu baris stok: jumlah satu barang pada satu toko. */
export interface IStock {
  _id?: string;
  itemID: string;
  storeID: string | null;
  quantity: number;
}

/** Masukan pemeriksaan ketersediaan stok. */
export interface ICheckStock {
  itemID: string;
  quantity: number;
}

/** Penunjuk baris stock-in yang hendak dihapus. */
export interface IDeleteStockIn {
  goodReceiptID: string | null;
  adjustmentEventID: string | null;
  itemID: string;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "StockInterface\|DeleteStockInInterface" src
 */
export type StockInterface = IStock;
export type DeleteStockInInterface = IDeleteStockIn;
