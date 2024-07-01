export interface PackingListInterface {
  id?: string;
  name: string;
  date: Date;
  note: string;
  createdBy: string;
  createdAt?: Date;
  deletedBy?: string;
  deletedAt?: Date;
  customerID: string;
  salesID: string;
  items: PackingListItem[];
}

export interface PackingListItem {
  itemID: string;
  quantity: number;
  price: number;
  discount: number;
}

export interface PackingListFetchInterface {
  keyword: string;
  month: number;
  year: number;
  page: number;
  status: string[];
}

export enum PackingListStatus {
  "Active" = "active",
  "Deleted" = "deleted",
}
