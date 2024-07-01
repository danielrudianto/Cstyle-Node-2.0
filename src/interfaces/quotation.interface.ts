export interface QuotationInterface {
  id?: string;
  date: Date;
  expiryDate: Date;
  name?: string;
  customerID?: string;
  note?: string;
  createdBy: string;
  createdAt: Date;
  items: QuotationItemInteface[];
}

export interface QuotationItemInteface {
  itemID: string;
  quantity: number;
  price: number;
  discount: number;
}

export interface QuotationSearchInterface {
  keyword: string;
  page: number;
  month: number; // 0 - 11
  year: number;
  status: QuotationStatus[];
}

export enum QuotationStatus {
  "Active" = "active",
  "Expired" = "expired",
  "Canceled" = "canceled",
}
