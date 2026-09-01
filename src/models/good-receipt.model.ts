import {
  IGoodReceipt,
  IGoodReceiptItem,
} from "../interfaces/good-receipt.interface";

/**
 * Penerimaan barang sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/good-receipt.repository.ts.
 *
 * Kode lama memecah domain ini menjadi DUA kelas — GoodReceiptCreateModel yang
 * membawa data dan GoodReceiptModelModel yang hanya berisi metode statis.
 * Pemisahan itu tidak punya alasan selain sejarah, jadi keduanya disatukan
 * kembali: datanya di sini, query-nya di repository.
 */
export class GoodReceiptModel {
  _id?: string;
  name: string;
  date: Date;
  supplierID: any;
  items: IGoodReceiptItem[];
  createdBy: any;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;

  constructor(data: IGoodReceipt) {
    this._id = data._id;
    this.name = data.name;
    this.date = data.date;
    this.supplierID = data.supplierID;
    this.items = data.items;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): GoodReceiptModel {
    return new GoodReceiptModel({
      _id: data._id?.toString(),
      name: data.name,
      date: data.date,
      supplierID: data.supplierID,
      items: data.items ?? [],
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * Harga pokok satu baris setelah potongan.
   *
   * Inilah angka yang masuk ke `stock-ins.price` dan menjadi dasar seluruh
   * perhitungan HPP di kemudian hari. `discount` di sini berupa PERSEN, sesuai
   * yang dikirim klien — berbeda dari `discount` yang tersimpan di dokumen,
   * yang sudah berupa rupiah.
   */
  static netPrice(price: number, discountPercent: number): number {
    return (price * (100 - discountPercent)) / 100;
  }
}

export default GoodReceiptModel;
