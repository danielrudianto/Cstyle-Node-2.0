import { IItemBrand } from "../interfaces/item-brand.interface";

/**
 * Merek barang sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/item-brand.repository.ts.
 */
export class ItemBrandModel {
  _id?: string;
  name?: string;
  createdBy?: string;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;

  constructor(data: IItemBrand) {
    this._id = data._id;
    this.name = data.name;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): ItemBrandModel {
    return new ItemBrandModel({
      _id: data._id?.toString(),
      name: data.name,
      createdBy: data.createdBy?.toString(),
      createdAt: data.createdAt,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy?.toString() ?? null,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default ItemBrandModel;
