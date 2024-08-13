import { Types } from "mongoose";
import { connectionFactory } from "../utils/connector.utils";
import {
  BillFetchInterface,
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

  static fetch(data: BillFetchInterface) {
    if (data.isOwner) {
      return Promise.all([
        conn
          .model("bills")
          .find({
            isHidden: false,
            name: RegExp(data.keyword, "i"),
            $expr: {
              $and: [
                { $eq: [{ $month: "$date" }, data.month] },
                { $eq: [{ $year: "$date" }, data.year] },
              ],
            },
          })
          .limit(20)
          .skip((data.page - 1) * 20),
        conn.model("bills").countDocuments({
          isHidden: false,
          name: RegExp(data.keyword, "i"),
          $expr: {
            $and: [
              { $eq: [{ $month: "$date" }, data.month] },
              { $eq: [{ $year: "$date" }, data.year] },
            ],
          },
        }),
      ]);
    } else {
      return Promise.all([
        conn
          .model("bills")
          .find({
            name: RegExp(data.keyword, "i"),
            $expr: {
              $and: [
                { $eq: [{ $month: "$date" }, data.month] },
                { $eq: [{ $year: "$date" }, data.year] },
              ],
            },
          })
          .limit(20)
          .skip((data.page - 1) * 20),
        ,
        conn.model("bills").countDocuments({
          name: RegExp(data.keyword, "i"),
          $expr: {
            $and: [
              { $eq: [{ $month: "$date" }, data.month] },
              { $eq: [{ $year: "$date" }, data.year] },
            ],
          },
        }),
      ]);
    }
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

  static fetchReport(
    storeID: string | null,
    month: number,
    year: number,
    shownOnly: boolean = true
  ) {
    let query: any = {
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, year] },
          { $eq: [{ $month: "$date" }, month] },
        ],
      },
    };

    if (shownOnly) {
      query.isHidden = false;
    }

    if (storeID) {
      query.storeID = storeID;
    }

    return conn
      .model("bills")
      .find(query)
      .populate("createdBy", "name")
      .populate("memberID", "code");
  }

  static fetchStoreReport(storeID: string) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    return conn.model("bills").find({
      storeID: storeID,
      isDelete: false,
      date: date,
    });
  }

  static fetchProductReport(
    storeID: string | null,
    month: number,
    year: number,
    shownOnly: boolean = true
  ) {
    let query: any = {
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, year] },
          { $eq: [{ $month: "$date" }, month] },
        ],
      },
    };

    if (storeID) {
      query.storeID = storeID;
    }

    if (shownOnly) {
      query.isHidden = false;
    }

    return conn
      .model("bills")
      .find(query)
      .populate("items.itemID", "reference description")
      .populate("storeID", "name")
      .populate("memberID", "code");
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

  static countBills(storeID: string, period: number) {
    return Promise.all([
      period == -1
        ? conn.model("bills").countDocuments({
            isDelete: false,
            storeID: storeID,
          })
        : conn.model("bills").countDocuments({
            isDelete: false,
            storeID: storeID,
            date: {
              $gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000),
            },
          }),
      conn.model("bills").aggregate([
        period == -1
          ? {
              $match: {
                storeID: storeID,
                isDelete: false,
              },
            }
          : {
              $match: {
                storeID: storeID,
                isDelete: false,
                date: {
                  $gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000),
                },
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
}
export default BillModelModel;
