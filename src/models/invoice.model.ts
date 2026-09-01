import { IInvoice } from "../interfaces/invoice.interface";

/**
 * Faktur penjualan sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/invoice.repository.ts.
 *
 * Bidang referensi bertipe longgar karena bisa berupa ObjectId atau dokumen
 * yang sudah di-populate, tergantung query pemanggilnya.
 */
export class InvoiceModel {
  _id?: string;
  name: string;
  date: Date;
  note: string;
  dueDate: Date;
  packingListID: any;
  deliverySlipID: any;
  createdBy: any;
  createdAt?: Date;
  customerID: any;
  salesID: any;
  isPaid?: boolean;
  payments?: any[];
  isHidden?: boolean;
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;

  constructor(data: IInvoice) {
    this._id = data._id;
    this.name = data.name;
    this.date = data.date;
    this.note = data.note;
    this.dueDate = data.dueDate;
    this.packingListID = data.packingListID;
    this.deliverySlipID = data.deliverySlipID;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.customerID = data.customerID;
    this.salesID = data.salesID;
    this.isPaid = data.isPaid;
    this.payments = data.payments;
    this.isHidden = data.isHidden;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): InvoiceModel {
    return new InvoiceModel({
      _id: data._id?.toString(),
      name: data.name,
      date: data.date,
      note: data.note,
      dueDate: data.dueDate,
      packingListID: data.packingListID,
      deliverySlipID: data.deliverySlipID,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      customerID: data.customerID,
      salesID: data.salesID,
      isPaid: data.isPaid,
      payments: data.payments,
      isHidden: data.isHidden,
      isDelete: data.isDelete,
      deletedBy: data.deletedBy,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default InvoiceModel;
