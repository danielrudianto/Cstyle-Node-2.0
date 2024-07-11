export interface StockInterface {
  itemID: string;
  storeID: string | null;
  quantity: number;
}

export interface DeleteStockInInterface {
  goodReceiptID: string | null;
  adjustmentEventID: string | null;
  itemID: string;
}
