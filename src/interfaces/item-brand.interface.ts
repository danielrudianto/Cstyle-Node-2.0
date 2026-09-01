/** Bentuk data merek barang, mengikuti koleksi `itembrands`. */
export interface IItemBrand {
  _id?: string;
  name?: string;
  createdBy?: string;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}
