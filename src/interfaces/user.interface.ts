/** Bentuk data pengguna, mengikuti koleksi `users`. */
export interface IUser {
  _id?: string;
  name: string;
  username: string;
  password?: string;
  isActive: boolean;
  code: string;
  accessLevel: number;
  createdBy?: string | null;
  createdAt?: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

/** Baris ringkas untuk autocomplete sales. */
export interface IUserSales {
  _id: string;
  name: string;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "UserInterface" src
 */
export type UserInterface = IUser;
