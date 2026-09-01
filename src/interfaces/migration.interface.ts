/**
 * Bentuk data untuk antrian migrasi.
 *
 * Koleksi `migrations` bukan tabel data biasa: isinya baris-baris perintah SQL
 * yang nanti dijalankan aplikasi kasir pada database SQLite lokalnya. Jadi
 * yang tersimpan adalah nomor versi dan satu string perintah.
 */

/** Satu baris antrian migrasi. */
export interface IMigration {
  _id?: string;
  migration_version: number;
  command: string;
}

export interface IProductMigration {
  id: string;
  reference: string;
  description: string;
  barcode: string | null;
  brand: string;
  type: string;
  price: number;
  brandID: string;
  typeID: string;
  isActive: boolean;
  images: string[];
}

export interface IProductImageMigration {
  id: string;
  images: string[];
}

export interface IProductBrandMigration {
  id: string;
  name: string;
}

export interface IProductTypeMigration {
  id: string;
  name: string;
}

export interface IUserMigration {
  userID: string;
  code: string;
  name: string;
}
