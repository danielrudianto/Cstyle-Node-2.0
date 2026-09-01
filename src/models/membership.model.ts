import { IMembership, IMembershipPoint } from "../interfaces/membership.interface";

/**
 * Anggota sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/membership.repository.ts.
 *
 * `storeID` bertipe longgar karena bisa datang sebagai ObjectId atau sebagai
 * dokumen toko yang sudah di-populate, tergantung query pemanggilnya.
 */
export class MembershipModel {
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

  constructor(data: IMembership) {
    this._id = data._id;
    this.name = data.name;
    this.code = data.code;
    this.point = data.point;
    this.email = data.email;
    this.phoneNumber = data.phoneNumber;
    this.nationality = data.nationality;
    this.language = data.language;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.birthday = data.birthday;
    this.storeID = data.storeID;
  }

  static fromMap(data: any): MembershipModel {
    return new MembershipModel({
      _id: data._id?.toString(),
      name: data.name,
      code: data.code,
      point: data.point,
      email: data.email ?? null,
      phoneNumber: data.phoneNumber ?? null,
      nationality: data.nationality ?? null,
      language: data.language,
      createdBy: data.createdBy?.toString(),
      createdAt: data.createdAt,
      birthday: data.birthday,
      storeID: data.storeID,
    });
  }
}

/** Satu baris riwayat kurs penukaran poin. */
export class MembershipPointModel {
  _id?: string;
  conversion: number;
  createdBy: any;
  createdAt?: Date;

  constructor(data: IMembershipPoint) {
    this._id = data._id;
    this.conversion = data.conversion;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
  }

  static fromMap(data: any): MembershipPointModel {
    return new MembershipPointModel({
      _id: data._id?.toString(),
      conversion: data.conversion,
      /* Bisa berupa ObjectId atau dokumen pengguna yang sudah di-populate. */
      createdBy: data.createdBy,
      createdAt: data.createdAt,
    });
  }
}

export default MembershipModel;
