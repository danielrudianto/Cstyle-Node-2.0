export interface SalesInvoiceInterface {
  id: string;
  type: string;
  name: string;
  date: Date;
  customerID: string;
  salesID: string;
  items: any[];
  note: string;
  isDelete: boolean;
  isPaid: boolean;
  dueDate: Date;
  createdAt: Date;
  createdBy: string;
  deletedBy?: string;
  deletedAt?: Date;
}
