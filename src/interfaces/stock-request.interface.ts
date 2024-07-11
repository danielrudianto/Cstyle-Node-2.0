export interface createStockTransferInterface {
  id?: string;
  name: string;
  date: Date;
  items: createStockTransferItemInterface[];
  note: string;
  createdBy: string;
  requestFrom: string | null;
  requestTo: string | null;
}

export interface precreateStockTransferInterface {
  month: number;
  year: number;
}

export interface createStockTransferItemInterface {
  itemID: string;
  quantity: number;
}

export interface StockTransferFetchInterface {
  month: number;
  year: number;
  page: number;
  keyword: string;
  status: string[];
}

export interface StockTransferSendInterface {
  id: string;
  createdBy: string;
  items: sendStockTransferItemInterface[];
}

export interface sendStockTransferItemInterface {
  id: string;
  quantity: number;
}
