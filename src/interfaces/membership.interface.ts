/** Bentuk data anggota, mengikuti koleksi `memberships`. */
export interface IMembership {
  _id?: string;
  name: string;
  code: string;
  point: number;
  email: string | null;
  phoneNumber: string | null;
  nationality: string | null;
  language: string;
  createdBy: string;
  createdAt?: Date;
  birthday?: Date;
  storeID?: any;
}

/** Satu baris riwayat kurs penukaran poin. */
export interface IMembershipPoint {
  _id?: string;
  conversion: number;
  createdBy: string;
  createdAt?: Date;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "MembershipInterface\|MembershipPointInterface" src
 */
export type MembershipInterface = IMembership;
export type MembershipPointInterface = IMembershipPoint;
