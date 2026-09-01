/** Satu baris barang pada surat jalan; `returned` diisi saat barang kembali. */
export interface IDeliverySlipItem {
  itemID: any;
  quantity: number;
  price: number;
  discount: number;
  returned: number;
}

/** Bentuk data surat jalan, mengikuti koleksi `delivery-slips`. */
export interface IDeliverySlip {
  _id?: string;
  name: string;
  date: Date;
  note?: string;
  customerID: any;
  salesID: any;
  items: IDeliverySlipItem[];
  createdBy: any;
  createdAt?: Date;
  deletedBy?: any;
  deletedAt?: Date | null;
  isDelete?: boolean;
  isReturn?: boolean;
  returnedAt?: Date | null;
}

/** Masukan pencatatan pengembalian barang. */
export interface IDeliverySlipReturn {
  id: string;
  returnedAt: Date;
  items: IDeliverySlipReturnItem[];
}

export interface IDeliverySlipReturnItem {
  id: string;
  return: number;
}

/** Masukan pencarian surat jalan. */
export interface IDeliverySlipFetch {
  page: number;
  keyword: string;
  month: number;
  year: number;
  status: DeliverySlipFetchStatus[];
}

export enum DeliverySlipFetchStatus {
  "active" = "active",
  "returned" = "returned",
  "canceled" = "canceled",
}

/**
 * Nama lama, dipertahankan selama masa peralihan.
 *
 * Hapus begitu tidak ada lagi yang memakainya:
 *   grep -rn "DeliverySlipInterface\|DeliverySlipItem\b" src
 */
export type DeliverySlipInterface = IDeliverySlip;
export type DeliverySlipItem = IDeliverySlipItem;
export type DeliverySlipUpdateInterface = IDeliverySlipReturn;
