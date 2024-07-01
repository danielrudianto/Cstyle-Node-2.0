import { Types } from "mongoose";
import { connectionFactory } from "../utils/connector.utils";
import {
  BillInterface,
  BillItemInterface,
  BillPaymentInterface,
} from "../interfaces/bill.interface";

const conn = connectionFactory();
class BillModelModel {
  _id?: String;
  name: String;
  date: String;
  memberID?: Types.ObjectId | String | null;
  storeID: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  items: BillItemInterface[];
  payment: BillPaymentInterface[];

  constructor(data: BillInterface) {
    this._id = data._id;
    this.name = data.name;
    this.date = data.date;
    this.memberID = data.memberID;
    this.storeID = data.storeID;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.items = data.items;
    this.payment = data.payment;
  }

  static insertMany(data: BillInterface[]) {
    return conn.model("bills").insertMany(data);
  }

  static fetchByID(id: string) {
    return conn.model("bills").findById(id);
  }
}
export default BillModelModel;
