import {
  IStockRequest,
  IStockRequestItem,
} from "../interfaces/stock-request.interface";

/**
 * Permintaan transfer stok sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/stock-request.repository.ts.
 *
 * Arah `requestFrom` dan `requestTo` mudah tertukar — penjelasannya ada di
 * interfaces/stock-request.interface.ts.
 */
export class StockRequestModel {
  _id?: string;
  name: string;
  date: Date;
  items: IStockRequestItem[];
  note: string;
  createdBy: any;
  createdAt?: Date;
  requestFrom: any;
  requestTo: any;
  isSending?: boolean;
  isConfirm?: boolean;
  isReject?: boolean;
  isDelete?: boolean;
  rejectNote?: string | null;

  constructor(data: IStockRequest) {
    this._id = data._id;
    this.name = data.name;
    this.date = data.date;
    this.items = data.items;
    this.note = data.note;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.requestFrom = data.requestFrom;
    this.requestTo = data.requestTo;
    this.isSending = data.isSending;
    this.isConfirm = data.isConfirm;
    this.isReject = data.isReject;
    this.isDelete = data.isDelete;
    this.rejectNote = data.rejectNote;
  }

  static fromMap(data: any): StockRequestModel {
    return new StockRequestModel({
      _id: data._id?.toString(),
      name: data.name,
      date: data.date,
      items: data.items ?? [],
      note: data.note,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      requestFrom: data.requestFrom,
      requestTo: data.requestTo,
      isSending: data.isSending,
      isConfirm: data.isConfirm,
      isReject: data.isReject,
      isDelete: data.isDelete,
      rejectNote: data.rejectNote ?? null,
    });
  }
}

export default StockRequestModel;
