import { IQuotation, IQuotationItem } from "../interfaces/quotation.interface";

/**
 * Penawaran sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/quotation.repository.ts.
 *
 * `customerID`, `createdBy`, dan `items[].itemID` bertipe longgar karena bisa
 * datang sebagai ObjectId atau sebagai dokumen yang sudah di-populate,
 * tergantung query pemanggilnya.
 */
export class QuotationModel {
  _id?: string;
  date: Date;
  expiryDate: Date;
  name?: string;
  customerID?: any;
  note?: string;
  createdBy: any;
  createdAt: Date;
  items: IQuotationItem[];
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;

  constructor(data: IQuotation) {
    this._id = data._id;
    this.date = data.date;
    this.expiryDate = data.expiryDate;
    this.name = data.name;
    this.customerID = data.customerID;
    this.note = data.note;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.items = data.items;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  static fromMap(data: any): QuotationModel {
    return new QuotationModel({
      _id: data._id?.toString(),
      date: data.date,
      expiryDate: data.expiryDate,
      name: data.name,
      customerID: data.customerID,
      note: data.note,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      items: data.items ?? [],
      isDelete: data.isDelete,
      deletedBy: data.deletedBy,
      deletedAt: data.deletedAt ?? null,
    });
  }
}

export default QuotationModel;
