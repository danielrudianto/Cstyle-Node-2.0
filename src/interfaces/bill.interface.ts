import { Types } from "mongoose";

export interface BillInterface {
  _id?: String;
  name: String;
  date: String;
  memberID: Types.ObjectId | null;
  storeID: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  items: BillItemInterface[];
  payment: BillPaymentInterface[];
}

export interface BillItemInterface {
  itemID: Types.ObjectId;
  quantity: number;
  price: number;
  discount: number;
  percentage: number;
}

export interface BillPaymentInterface {
  type: string;
  amount: number;
}
