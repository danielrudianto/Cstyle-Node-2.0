import { ICustomer } from "../interfaces/customer.interface";

/**
 * Pelanggan sebagai objek data murni.
 *
 * Kelas ini TIDAK menyentuh database. Sebelumnya berkas ini memanggil
 * connectionFactory() di tingkat modul lalu menjalankan query Mongoose di
 * dalam metodenya, jadi ia sekaligus jadi wadah data dan lapisan akses data.
 * Query-nya sekarang tinggal di repositories/customer.repository.ts.
 *
 * BENTUK BALASAN HTTP.
 *
 * Bidang di bawah sengaja mencerminkan dokumen MongoDB satu per satu, karena
 * controller mengirim objek ini langsung ke klien. Menambah, menghapus, atau
 * mengganti nama bidang di sini akan mengubah badan balasan API.
 *
 * Satu-satunya bidang dokumen yang tidak ikut adalah `__v`, penghitung versi
 * internal Mongoose yang tidak dipakai klien mana pun.
 */
export class CustomerModel {
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

  constructor(data: ICustomer) {
    this._id = data._id;
    this.name = data.name;
    this.address = data.address;
    this.phoneNumber = data.phoneNumber;
    this.email = data.email;
    this.npwp = data.npwp;
    this.type = data.type;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  /**
   * Membangun model dari dokumen Mongoose mentah.
   *
   * ObjectId diubah menjadi teks di sini supaya lapisan di atas repository
   * tidak perlu tahu tipe bawaan MongoDB. JSON yang dikirim ke klien tetap
   * sama, karena ObjectId memang diserialisasi sebagai teks.
   */
  static fromMap(data: any): CustomerModel {
    return new CustomerModel({
      _id: data._id?.toString(),
      name: data.name,
      address: data.address,
      phoneNumber: data.phoneNumber ?? null,
      email: data.email ?? null,
      npwp: data.npwp ?? null,
      type: data.type,
      createdBy: data.createdBy?.toString(),
      createdAt: data.createdAt,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy?.toString() ?? null,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default CustomerModel;
