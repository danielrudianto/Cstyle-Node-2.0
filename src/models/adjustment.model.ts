import {
  IAdjustment,
  IAdjustmentItem,
} from "../interfaces/adjustment.interface";

/**
 * Penyesuaian stok sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/adjustment.repository.ts.
 */
export class AdjustmentModel {
  _id?: string;
  name?: string;
  date: Date;
  createdBy: any;
  createdAt?: Date;
  items: IAdjustmentItem[];
  storeID: any;
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;

  constructor(data: IAdjustment) {
    this._id = data._id;
    this.name = data.name;
    this.date = data.date;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.items = data.items;
    this.storeID = data.storeID;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): AdjustmentModel {
    return new AdjustmentModel({
      _id: data._id?.toString(),
      name: data.name,
      date: data.date,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      items: data.items ?? [],
      storeID: data.storeID,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default AdjustmentModel;
