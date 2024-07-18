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

export interface InvoiceFetchInterface {
  keyword: string;
  status: string[];
  paymentStatus: string[];
  page: number;
  month: number;
  year: number;
}

export interface UpdateInvoicePaymentInterface {
  id: string;
  paidAt: Date;
  paymentMethod: string;
  paidBy: string;
  amount: number;
}
