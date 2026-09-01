/** Satu baris barang pada nota kasir. */
export interface IBillItem {
  itemID: any;
  quantity: number;
  price: number;
  /** Nilai potongan per satuan, sudah berupa rupiah — bukan persen. */
  discount: number;
  /** Persentase potongan yang dikirim kasir, disimpan untuk jejak. */
  percentage: number;
}

/** Satu baris pembayaran; satu nota bisa dibayar dengan beberapa metode. */
export interface IBillPayment {
  type: string;
  amount: number;
}

/**
 * Bentuk data nota kasir, mengikuti koleksi `bills`.
 *
 * `date` bertipe teks, bukan Date — perangkat kasir mengirimnya sudah dalam
 * bentuk "YYYY-MM-DD" dan Mongoose yang mengecornya saat menyimpan.
 */
export interface IBill {
  _id?: any;
  name: string;
  date: string;
  memberID: any;
  storeID: any;
  createdBy: any;
  createdAt: Date;
  items: IBillItem[];
  payment: IBillPayment[];
  isHidden?: boolean;
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;
}

/** Masukan pencarian nota dari aplikasi kantor. */
export interface IBillFetch {
  page: number;
  /** Kosong berarti seluruh toko. */
  storeID: string[];
  /** 0 - 11, gaya JavaScript; repository yang menambahkan satu. */
  month: number;
  year: number;
  /** Pemilik melihat lebih sedikit: nota tersembunyi disaring keluar. */
  isOwner: boolean;
  keyword: string;
}

/** Masukan daftar nota harian satu toko, dipakai aplikasi kasir. */
export interface IStoreBillFetch {
  page: number;
  storeID: string;
}

/** Masukan penyembunyian nota dari laporan. */
export interface IBillVisibility {
  id: string;
  isHidden: boolean;
}

export interface IBillDelete {
  id: string;
  userID: string;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "BillInterface\|BillItemInterface" src
 */
export type BillInterface = IBill;
export type BillItemInterface = IBillItem;
export type BillPaymentInterface = IBillPayment;
