export interface ItemInterface {
  id?: string;
  reference?: string;
  description?: string;
  itemTypeID?: string;
  itemBrandID?: string;
  createdBy?: string;
  price?: number;
  barcode?: string | null;
  isFavorite?: boolean;
  images?: string[];
  isActive: boolean;
}

export interface ItemFetchInterface {
  page: number;
  keyword: string;
}

export interface ItemFetchInterfaceBranch extends ItemFetchInterface {
  branch: string | null;
  onlyActive: boolean;
}

export interface ItemUpdateFavorite {
  id: string;
  isFavorite: boolean;
}

export interface ItemDeleteInterface {
  id: string;
  userID: string;
}

export interface ItemPriceFetchInterface {
  brand: string[];
  type: string[];
}
