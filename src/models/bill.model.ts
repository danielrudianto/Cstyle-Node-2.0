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

  static fetchStatus() {
    const todayDate = new Date();
    const weekDate = new Date();
    const biweekDate = new Date();
    const monthDate = new Date();

    weekDate.setDate(todayDate.getDate() - 7);
    biweekDate.setDate(todayDate.getDate() - 14);
    monthDate.setDate(todayDate.getDate() - 300);

    return Promise.all([
      conn.model("bills").aggregate([
        {
          $match: {
            date: {
              $gte: new Date(todayDate),
            },
            isDelete: false,
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: null,
            value: {
              $sum: {
                $multiply: [
                  { $subtract: ["$items.price", "$items.discount"] },
                  "$items.quantity",
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            value: "$value",
          },
        },
      ]),
      conn.model("bills").aggregate([
        {
          $match: {
            date: {
              $gte: new Date(todayDate),
            },
            isDelete: false,
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: null,
            value: {
              $sum: {
                $multiply: [
                  { $subtract: ["$items.price", "$items.discount"] },
                  "$items.quantity",
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            value: "$value",
          },
        },
      ]),
      conn.model("bills").aggregate([
        {
          $match: {
            date: {
              $gte: new Date(biweekDate),
            },
            isDelete: false,
          },
        },

        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: null,
            value: {
              $sum: {
                $multiply: [
                  { $subtract: ["$items.price", "$items.discount"] },
                  "$items.quantity",
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            value: "$value",
          },
        },
      ]),
      conn.model("bills").aggregate([
        {
          $match: {
            date: {
              $gte: new Date(monthDate),
            },
            isDelete: false,
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: null,
            value: {
              $sum: {
                $multiply: [
                  { $subtract: ["$items.price", "$items.discount"] },
                  "$items.quantity",
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            value: "$value",
          },
        },
      ]),
    ]);
  }

  static fetchMemberTransactions() {
    return conn.model("bills").countDocuments({
      memberID: {
        $ne: null,
      },
      isDelete: false,
      date: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
}
export default BillModelModel;
