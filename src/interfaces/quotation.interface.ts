/** Satu baris barang pada penawaran. */
export interface IQuotationItem {
  itemID: any;
  quantity: number;
  price: number;
  discount: number;
}

/** Bentuk data penawaran, mengikuti koleksi `quotations`. */
export interface IQuotation {
  _id?: string;
  date: Date;
  expiryDate: Date;
  name?: string;
  customerID?: any;
  note?: string;
  createdBy: any;
  createdAt: Date;
  items: IQuotationItem[];
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;
}

/** Masukan pencarian penawaran. */
export interface IQuotationSearch {
  keyword: string;
  page: number;
  /** 1 - 12, bukan 0 - 11: controller sudah menambahkan satu. */
  month: number;
  year: number;
  status: QuotationStatus[];
}

export enum QuotationStatus {
  "Active" = "active",
  "Expired" = "expired",
  "Canceled" = "canceled",
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "QuotationInterface\|QuotationItemInteface" src
 */
export type QuotationInterface = IQuotation;
export type QuotationItemInteface = IQuotationItem;
