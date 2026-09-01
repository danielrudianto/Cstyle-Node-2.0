import { IItem } from "../interfaces/item.interface";

/**
 * Barang sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/item.repository.ts.
 *
 * `itemBrandID` dan `itemTypeID` diteruskan APA ADANYA — bisa berupa
 * ObjectId, bisa dokumen yang sudah di-populate — karena kedua bentuk itu
 * memang dipakai oleh pemanggil yang berbeda. Lihat catatan di
 * interfaces/item.interface.ts.
 */
export class ItemModel {
  _id?: string;
  reference?: string;
  description?: string;
  itemTypeID?: any;
  itemBrandID?: any;
  createdBy?: string;
  createdAt?: Date;
  price?: number;
  barcode?: string | null;
  isFavorite?: boolean;
  images?: string[];
  isActive?: boolean;
  isDelete?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;

  constructor(data: IItem) {
    this._id = data._id;
    this.reference = data.reference;
    this.description = data.description;
    this.itemTypeID = data.itemTypeID;
    this.itemBrandID = data.itemBrandID;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.price = data.price;
    this.barcode = data.barcode;
    this.isFavorite = data.isFavorite;
    this.images = data.images;
    this.isActive = data.isActive;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): ItemModel {
    return new ItemModel({
      _id: data._id?.toString(),
      reference: data.reference,
      description: data.description,
      itemTypeID: data.itemTypeID,
      itemBrandID: data.itemBrandID,
      createdBy: data.createdBy?.toString(),
      createdAt: data.createdAt,
      price: data.price,
      barcode: data.barcode,
      isFavorite: data.isFavorite,
      images: data.images,
      isActive: data.isActive,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy?.toString() ?? null,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default ItemModel;
