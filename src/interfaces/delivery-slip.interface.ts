export interface DeliverySlipInterface {
  id?: string;
  name: string;
  date: Date;
  note: string;
  customerID: string;
  salesID: string;
  items: DeliverySlipItem[];
  createdBy: string;
  createdAt?: Date;
  deletedBy?: string;
  deletedAt?: Date;
}

export interface DeliverySlipItem {
  itemID: string;
  quantity: number;
  price: number;
  discount: number;
}
