import {
  IPackingList,
  IPackingListItem,
} from "../interfaces/packing-list.interface";

/**
 * Packing list sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/packing-list.repository.ts.
 */
export class PackingListModel {
  _id?: string;
  name?: string;
  date: Date;
  note: string;
  customerID: any;
  salesID: any;
  items: IPackingListItem[];
  createdBy: any;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;

  constructor(data: IPackingList) {
    this._id = data._id;
    this.name = data.name;
    this.date = data.date;
    this.note = data.note;
    this.customerID = data.customerID;
    this.salesID = data.salesID;
    this.items = data.items;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): PackingListModel {
    return new PackingListModel({
      _id: data._id?.toString(),
      name: data.name,
      date: data.date,
      note: data.note,
      customerID: data.customerID,
      salesID: data.salesID,
      items: data.items ?? [],
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * Menggabungkan baris barang yang identik.
   *
   * Dua baris digabung hanya kalau barang, harga, DAN diskonnya sama persis —
   * barang yang sama dengan harga berbeda tetap jadi dua baris, karena
   * harganya memang berbeda di faktur.
   *
   * Ini murni perhitungan tanpa akses database, jadi tempatnya di model.
   */
  static mergeItems(items: IPackingListItem[]): IPackingListItem[] {
    const hasil: IPackingListItem[] = [];

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

export default PackingListModel;
