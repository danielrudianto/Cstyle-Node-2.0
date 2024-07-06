export interface StockCardInterface {
  id?: string;
  itemID: string;
  quantity: number;
  billID: string | null;
  adjustmentEventID: string | null;
  goodReceiptID: string | null;
  invoiceID: string | null;
  deliverySlipID: string | null;
  date: Date;
}
