export interface StoreInterface {
  id?: string;
  name: string;
  address: string;
  phoneNumber: string;
  prefix: string;
  code?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface StoreUpdateInterface {
  id: string;
  name: string;
  prefix: string;
}
