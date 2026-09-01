/** Satu baris barang pada permintaan transfer stok. */
export interface IStockRequestItem {
  itemID: any;
  quantity: number;
}

/**
 * Bentuk data permintaan transfer stok, mengikuti koleksi `stock-requests`.
 *
 * ARAHNYA MUDAH TERTUKAR — baca ini dulu sebelum menyentuh kodenya:
 *
 *   requestFrom = toko yang MEMINTA barang (tujuan akhir barang)
 *   requestTo   = toko yang DIMINTAI barang (asal barang)
 *
 * Jadi barang bergerak dari `requestTo` ke `requestFrom`, kebalikan dari yang
 * biasa dibayangkan orang saat membaca namanya.
 *
 * ALURNYA EMPAT TAHAP, ditandai empat penanda boolean:
 *
 *   dibuat   isSending=false isConfirm=false isReject=false
 *   dikirim  isSending=true                              -> stok requestTo berkurang
 *   diterima isConfirm=true                              -> stok requestFrom bertambah
 *   ditolak  isReject=true   + rejectNote
 */
export interface IStockRequest {
  _id?: string;
  name: string;
  date: Date;
  items: IStockRequestItem[];
  note: string;
  createdBy: any;
  createdAt?: Date;
  requestFrom: any;
  requestTo: any;
  isSending?: boolean;
  isConfirm?: boolean;
  isReject?: boolean;
  isDelete?: boolean;
  rejectNote?: string | null;
}

/** Masukan pencarian permintaan transfer. */
export interface IStockRequestFetch {
  /** 1 - 12; controller sudah menambahkan satu dari bulan gaya JavaScript. */
  month: number;
  year: number;
  page: number;
  keyword: string;
  status: string[];
}

/** Masukan pengiriman: jumlah bisa DIKURANGI dari yang diminta. */
export interface IStockRequestSend {
  id: string;
  createdBy: string;
  items: IStockRequestSendItem[];
}

export interface IStockRequestSendItem {
  /** Ini id BARIS pada dokumen, bukan id barang. */
  id: string;
  quantity: number;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "createStockTransferInterface\|StockTransferSendInterface" src
 */
export type createStockTransferInterface = IStockRequest;
export type createStockTransferItemInterface = IStockRequestItem;
export type StockTransferSendInterface = IStockRequestSend;
export type sendStockTransferItemInterface = IStockRequestSendItem;
