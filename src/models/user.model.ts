import { IUser } from "../interfaces/user.interface";

/**
 * Pengguna sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/user.repository.ts.
 *
 * PERHATIAN: `password` IKUT DIBAWA.
 *
 * Bidang ini berisi hash bcrypt dan sengaja dipertahankan karena beberapa
 * pemanggil memang membutuhkannya — auth.controller membandingkannya saat
 * login, dan sync.utils menyalin seluruh objek pengguna ke Redis.
 *
 * Akibatnya, endpoint yang mengirim objek ini langsung ke klien ikut
 * membocorkan hash-nya. Itu perilaku yang SUDAH ADA sebelum refactor ini dan
 * dipertahankan supaya balasan API tidak berubah, bukan karena dianggap
 * benar. Perbaikannya: pisahkan bentuk tampilan (tanpa password) dari bentuk
 * yang dipakai proses autentikasi, lalu ubah pemanggilnya satu per satu.
 */
export class UserModel {
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

  constructor(data: IUser) {
    this._id = data._id;
    this.name = data.name;
    this.username = data.username;
    this.password = data.password;
    this.isActive = data.isActive;
    this.code = data.code;
    this.accessLevel = data.accessLevel;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): UserModel {
    return new UserModel({
      _id: data._id?.toString(),
      name: data.name,
      username: data.username,
      password: data.password,
      isActive: data.isActive,
      code: data.code,
      accessLevel: data.accessLevel,
      createdBy: data.createdBy?.toString() ?? null,
      createdAt: data.createdAt,
      deletedBy: data.deletedBy?.toString() ?? null,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default UserModel;
