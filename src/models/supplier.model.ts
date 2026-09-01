import { ISupplier } from "../interfaces/supplier.interface";

/**
 * Pemasok sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/supplier.repository.ts.
 */
export class SupplierModel {
  _id?: string;
  name: string;
  address: string;
  phoneNumber: string;
  npwp: string;
  email: string;
  createdBy?: string;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;

  constructor(data: ISupplier) {
    this._id = data._id;
    this.name = data.name;
    this.address = data.address;
    this.phoneNumber = data.phoneNumber;
    this.npwp = data.npwp;
    this.email = data.email;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): SupplierModel {
    return new SupplierModel({
      _id: data._id?.toString(),
      name: data.name,
      address: data.address,
      phoneNumber: data.phoneNumber,
      npwp: data.npwp,
      email: data.email,
      createdBy: data.createdBy?.toString(),
      createdAt: data.createdAt,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy?.toString() ?? null,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default SupplierModel;
