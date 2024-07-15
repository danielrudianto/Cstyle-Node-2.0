export interface StockOutInterface {
  id?: string;
  date: Date;
  itemID: string;
  quantity: number;
  adjustmentEventID: string | null;
  billID: string | null;
  invoiceID: string | null;
  stockInID?: string;
  storeID: string | null;
}

export interface StockOutTempInterface {
  id?: string;
  date: Date;
  itemID: string;
  deliverySlipID: string;
  quantity: number;
}

export interface StockOutTransferInterface {
  storeID: string | null;
  itemID: string;
  quantity: number;
}

export interface RemoveStockInInterface {
  goodReceiptID: string | null;
  itemID: string;
  adjustmentCaseID: string | null;
  quantity: number;
  storeID: string | null;
}

export interface RemoveStockOutInterface {
  itemID: string;
  adjustmentCaseID: string | null;
  quantity: number;
  storeID: string | null;
  billID: string | null;
  invoiceID: string | null;
}
