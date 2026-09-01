/**
 * Bentuk data barang, mengikuti koleksi `items`.
 *
 * `itemBrandID` dan `itemTypeID` sengaja bertipe longgar. Tergantung query
 * yang memanggilnya, keduanya bisa berupa ObjectId apa adanya, atau dokumen
 * merek/jenis yang sudah di-populate. Kedua bentuk itu ikut terkirim ke klien
 * dan dipakai berbeda-beda oleh controller, jadi menyempitkannya menjadi satu
 * tipe akan mengubah balasan API.
 */
export interface IItem {
  _id?: string;
  reference?: string;
  description?: string;
  itemTypeID?: any;
  itemBrandID?: any;
  createdBy?: string;
  createdAt?: Date;
  price?: number;
  barcode?: string | null;
  isFavorite?: boolean;
  images?: string[];
  isActive?: boolean;
  isDelete?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

/** Pencarian barang berhalaman. */
export interface IItemFetch {
  page: number;
  keyword: string;
  onlyActive: boolean;
}

/** Pencarian barang berhalaman, dibatasi satu cabang. */
export interface IItemFetchBranch extends IItemFetch {
  branch: string | null;
}

export interface IItemUpdateFavorite {
  id: string;
  isFavorite: boolean;
}

export interface IItemDelete {
  id: string;
  userID: string;
}

export interface IItemPriceFetch {
  brand: string[];
  type: string[];
}

export interface IItemUpdatePrice {
  id: string;
  price: number;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "ItemInterface\|ItemFetchInterface" src
 */
export type ItemInterface = IItem;
export type ItemFetchInterface = IItemFetch;
