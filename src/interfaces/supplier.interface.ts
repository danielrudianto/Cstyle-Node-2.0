/** Bentuk data pemasok, mengikuti koleksi `suppliers`. */
export interface ISupplier {
  _id?: string;
  name: string;
  address: string;
  phoneNumber: string;
  npwp: string;
  email: string;
  createdBy?: string;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

/** Masukan pemeriksaan nama ganda saat penyuntingan. */
export interface ISupplierNameCheck {
  id: string;
  name: string;
}
