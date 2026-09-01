import {
  IDeliverySlip,
  IDeliverySlipItem,
} from "../interfaces/delivery-slip.interface";

/**
 * Surat jalan sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/delivery-slip.repository.ts.
 */
export class DeliverySlipModel {
  _id?: string;
  name: string;
  date: Date;
  note?: string;
  customerID: any;
  salesID: any;
  items: IDeliverySlipItem[];
  createdBy: any;
  createdAt?: Date;
  deletedBy?: any;
  deletedAt?: Date | null;
  isDelete?: boolean;
  isReturn?: boolean;
  returnedAt?: Date | null;

  constructor(data: IDeliverySlip) {
    this._id = data._id;
    this.name = data.name;
    this.date = data.date;
    this.note = data.note;
    this.customerID = data.customerID;
    this.salesID = data.salesID;
    this.items = data.items;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
    this.isDelete = data.isDelete;
    this.isReturn = data.isReturn;
    this.returnedAt = data.returnedAt;
  }

  static fromMap(data: any): DeliverySlipModel {
    return new DeliverySlipModel({
      _id: data._id?.toString(),
      name: data.name,
      date: data.date,
      note: data.note,
      customerID: data.customerID,
      salesID: data.salesID,
      items: data.items ?? [],
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      deletedBy: data.deletedBy,
      deletedAt: data.deletedAt ?? null,
      isDelete: data.isDelete,
      isReturn: data.isReturn,
      returnedAt: data.returnedAt ?? null,
    });
  }

  /**
   * Menggabungkan baris barang yang identik — barang, harga, DAN diskon sama.
   *
   * Perhitungan murni tanpa akses database, jadi tempatnya di model.
   */
  static mergeItems(items: IDeliverySlipItem[]): IDeliverySlipItem[] {
    const hasil: IDeliverySlipItem[] = [];

    for (const item of items) {
      const kembar = hasil.find(
        (x) =>
          x.itemID == item.itemID &&
          x.price == item.price &&
          x.discount == item.discount
      );

      if (kembar) {
        kembar.quantity += item.quantity;
      } else {
        hasil.push({ ...item });
      }
    }

    return hasil;
  }
}

export default DeliverySlipModel;
