/** Bentuk data faktur penjualan, mengikuti koleksi `invoices`. */
export interface IInvoice {
  _id?: string;
  name: string;
  date: Date;
  note: string;
  dueDate: Date;
  /** Faktur berasal dari packing list ATAU surat jalan, tidak keduanya. */
  packingListID: any;
  deliverySlipID: any;
  createdBy: any;
  createdAt?: Date;
  customerID: any;
  salesID: any;
  isPaid?: boolean;
  payments?: any[];
  isHidden?: boolean;
  isDelete?: boolean;
  deletedBy?: any;
  deletedAt?: Date | null;
}

/** Masukan pencarian faktur. */
export interface IInvoiceFetch {
  keyword: string;
  status: string[];
  paymentStatus: string[];
  page: number;
  month: number;
  year: number;
}

/** Masukan pencatatan pembayaran. */
export interface IInvoicePayment {
  id: string;
  paidAt: Date;
  paymentMethod: string;
  paidBy: string;
  amount: number;
}

/** Masukan penyembunyian faktur dari laporan. */
export interface IInvoiceVisibility {
  id: string;
  isHidden: boolean;
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "InvoiceInterface\|InvoiceUpdateInterface" src
 */
export type InvoiceInterface = IInvoice;
export type InvoiceFetchInterface = IInvoiceFetch;
export type UpdateInvoicePaymentInterface = IInvoicePayment;
export type InvoiceUpdateInterface = IInvoiceVisibility;
