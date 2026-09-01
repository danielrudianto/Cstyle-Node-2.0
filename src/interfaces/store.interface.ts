/** Bentuk data toko, mengikuti koleksi `stores`. */
export interface IStore {
  _id?: string;
  name: string;
  address: string;
  phoneNumber: string;
  prefix: string;
  code?: string;
  createdBy?: string;
  createdAt?: Date;
  isActive?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

/** Masukan pemeriksaan sebelum penyuntingan toko. */
export interface IStoreUpdateCheck {
  id: string;
  name: string;
  prefix: string;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "StoreInterface" src
 */
export type StoreInterface = IStore;
