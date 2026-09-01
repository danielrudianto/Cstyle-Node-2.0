import { IItemType } from "../interfaces/item-type.interface";

/**
 * Jenis barang sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/item-type.repository.ts.
 */
export class ItemTypeModel {
  _id?: string;
  name?: string;
  description?: string;
  createdBy?: string;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;

  constructor(data: IItemType) {
    this._id = data._id;
    this.name = data.name;
    this.description = data.description;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): ItemTypeModel {
    return new ItemTypeModel({
      _id: data._id?.toString(),
      name: data.name,
      description: data.description,
      createdBy: data.createdBy?.toString(),
      createdAt: data.createdAt,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy?.toString() ?? null,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default ItemTypeModel;
