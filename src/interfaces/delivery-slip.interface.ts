export interface DeliverySlipInterface {
  id?: string;
  name: string;
  date: Date;
  note: string;
  customerID: string;
  salesID: string;
  items: DeliverySlipItem[];
  createdBy: string;
  createdAt?: Date;
  deletedBy: string | null;
  deletedAt: Date | null;
  isDelete: boolean;
  isReturn: boolean;
  returnedAt: Date | null;
}

export interface DeliverySlipItem {
  itemID: string;
  quantity: number;
  price: number;
  discount: number;
  returned: number;
}

export interface DeliverySlipUpdateInterface {
  id: string;
  returnedAt: Date;
  items: DeliverySlipUpdateItem[];
}

export interface DeliverySlipUpdateItem {
  id: string;
  return: number;
}

export interface DeliverySlipFetchInterface {
  page: number;
  keyword: string;
  month: number;
  year: number;
  status: DeliverySlipFetchStatus[];
}

export enum DeliverySlipFetchStatus {
  "active" = "active",
  "returned" = "returned",
  "canceled" = "canceled",
}
