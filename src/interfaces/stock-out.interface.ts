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
