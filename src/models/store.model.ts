import { IStore } from "../interfaces/store.interface";

/**
 * Toko sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/store.repository.ts.
 */
export class StoreModel {
  _id?: string;
  name: string;
  address: string;
  phoneNumber: string;
  prefix: string;
  code?: string;
  createdBy?: string;
  createdAt?: Date;
  isActive?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;

  constructor(data: IStore) {
    this._id = data._id;
    this.name = data.name;
    this.address = data.address;
    this.phoneNumber = data.phoneNumber;
    this.prefix = data.prefix;
    this.code = data.code;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.isActive = data.isActive;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): StoreModel {
    return new StoreModel({
      _id: data._id?.toString(),
      name: data.name,
      address: data.address,
      phoneNumber: data.phoneNumber,
      prefix: data.prefix,
      code: data.code,
      createdBy: data.createdBy?.toString(),
      createdAt: data.createdAt,
      isActive: data.isActive,
      deletedBy: data.deletedBy?.toString() ?? null,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default StoreModel;
