export interface InvoiceInterface {
  id?: string;
  name: string;
  date: Date;
  note: string;
  dueDate: Date;
  packingListID: string | null;
  deliverySlipID: string | null;
  createdBy: string;
  createdAt?: Date;
  customerID: string;
  salesID: String;
  isHidden?: boolean;
  isDelete?: boolean;
  deletedBy?: string;
  deletedAt?: Date;
}
