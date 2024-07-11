export interface GoodReceiptInterface {
  id?: string;
  date: Date;
  name: string;
  supplierID: string;
}

export interface GoodReceiptCreateInterface {
  id?: string;
  date: Date;
  name: string;
  supplierID: string;
  items: GoodReceiptItemInterface[];
  createdBy: string;
}

export interface GoodReceiptItemInterface {
  itemID: string;
  price: number;
  quantity: number;
  discount: number;
}

export interface GoodReceiptSearchInterface {
  keyword: string;
  page: number;
  month: number; // 0 - 11
  year: number;
  status: GoodReceiptStatus[];
}

export enum GoodReceiptStatus {
  "Active" = "active",
  "Deleted" = "deleted",
}
