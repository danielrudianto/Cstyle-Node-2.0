/** Satu baris barang pada packing list. */
export interface IPackingListItem {
  itemID: any;
  quantity: number;
  price: number;
  discount: number;
}

/** Bentuk data packing list, mengikuti koleksi `packing-lists`. */
export interface IPackingList {
  _id?: string;
  name?: string;
  date: Date;
  note: string;
  createdBy: any;
  createdAt?: Date;
  deletedBy?: any;
  deletedAt?: Date | null;
  isDelete?: boolean;
  customerID: any;
  salesID: any;
  items: IPackingListItem[];
}

/** Masukan pencarian packing list. */
export interface IPackingListFetch {
  keyword: string;
  /** 1 - 12; controller sudah menambahkan satu dari bulan gaya JavaScript. */
  month: number;
  year: number;
  page: number;
  status: string[];
}

export enum PackingListStatus {
  "Active" = "active",
  "Deleted" = "deleted",
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "PackingListInterface\|PackingListItem\b" src
 */
export type PackingListInterface = IPackingList;
export type PackingListItem = IPackingListItem;
