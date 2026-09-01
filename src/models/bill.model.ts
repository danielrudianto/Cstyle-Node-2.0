import { IBill, IBillItem, IBillPayment } from "../interfaces/bill.interface";

/**
 * Nota kasir sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/bill.repository.ts.
 *
 * Bidang referensi bertipe longgar karena bisa berupa ObjectId atau dokumen
 * yang sudah di-populate, tergantung query pemanggilnya.
 */
export class BillModel {
  _id?: any;
  name: string;
  date: string;
  memberID: any;
  storeID: any;
  createdBy: any;
  createdAt: Date;
  items: IBillItem[];
  payment: IBillPayment[];
  isHidden?: boolean;
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;

  constructor(data: IBill) {
    this._id = data._id;
    this.name = data.name;
    this.date = data.date;
    this.memberID = data.memberID;
    this.storeID = data.storeID;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.items = data.items;
    this.payment = data.payment;
    this.isHidden = data.isHidden;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): BillModel {
    return new BillModel({
      _id: data._id,
      name: data.name,
      date: data.date,
      memberID: data.memberID,
      storeID: data.storeID,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      items: data.items ?? [],
      payment: data.payment ?? [],
      isHidden: data.isHidden,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * Nilai belanja nota, dihitung ulang dari barisnya.
   *
   * Sengaja tidak mengambil total yang dikirim perangkat kasir: yang dipercaya
   * adalah barisnya, bukan hasil hitungan perangkat.
   */
  static totalValue(items: IBillItem[]): number {
    return items.reduce(
      (acc, item) => acc + (item.price - item.discount) * item.quantity,
      0
    );
  }
}

export default BillModel;
