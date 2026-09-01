/** Bentuk data jenis barang, mengikuti koleksi `itemtypes`. */
export interface IItemType {
  _id?: string;
  name?: string;
  description?: string;
  createdBy?: string;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}
