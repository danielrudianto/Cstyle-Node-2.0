/**
 * Bentuk data pelanggan.
 *
 * Nama bidang mengikuti koleksi `customer` di MongoDB, BUKAN nama yang
 * dipakai badan permintaan HTTP. Keduanya berbeda di satu tempat: klien
 * mengirim `phone`, sedangkan yang tersimpan adalah `phoneNumber`. Pemetaan
 * itu dikerjakan di controller, supaya lapisan model dan repository hanya
 * berurusan dengan satu kosakata — kosakata database.
 */
export interface ICustomer {
  _id?: string;
  name: string;
  address: string;
  phoneNumber: string | null;
  email: string | null;
  npwp: string | null;
  type: string;
  createdBy?: string;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

/** Masukan untuk pencarian berhalaman. */
export interface ICustomerFetch {
  keyword: string;
  page: number;
}
