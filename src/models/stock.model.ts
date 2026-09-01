import { IStock } from "../interfaces/stock.interface";

/**
 * Baris stok sebagai objek data murni: satu barang pada satu toko.
 *
 * Query-nya sekarang tinggal di repositories/stock.repository.ts.
 */
export class StockModel {
  _id?: string;
  itemID: string;
  storeID: string | null;
  quantity: number;

  constructor(data: IStock) {
    this._id = data._id;
    this.itemID = data.itemID;
    this.storeID = data.storeID;
    this.quantity = data.quantity;
  }

  static fromMap(data: any): StockModel {
    return new StockModel({
      _id: data._id?.toString(),
      itemID: data.itemID?.toString(),
      storeID: data.storeID?.toString() ?? null,
      quantity: data.quantity,
    });
  }
}

export default StockModel;
