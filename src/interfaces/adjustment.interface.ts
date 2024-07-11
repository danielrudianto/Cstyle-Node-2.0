export interface AdjustmentInterface {
  id?: string;
  name?: string;
  date: Date;
  createdBy: string;
  createdAt?: Date;
  items: AdjustmentItemInterface[];
  storeID: string | null;
}

export interface AdjustmentItemInterface {
  itemID: string;
  quantity: number;
}

export interface AdjustmentFetchInterface {
  page: number;
  keyword: string;
  status: string[];
  month: number;
  year: number;
}
