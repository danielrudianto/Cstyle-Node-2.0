export interface StockInInterface {
  date: Date;
  itemID: string;
  quantity: number;
  residue: number;
  price: number;
  adjustmentEventID: string | null;
  goodReceiptID: string | null;
  storeID: string | null;
}
