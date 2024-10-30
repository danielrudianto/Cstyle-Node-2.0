import { Types } from "mongoose";
import { connectionFactory } from "../utils/connector.utils";
import {
  BillDeleteInterface,
  BillFetchInterface,
  BillInterface,
  BillItemInterface,
  BillPaymentInterface,
  BillUpdateInterface,
  StoreBillFetchInterface,
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
      if (data.storeID.length == 0) {
        return Promise.all([
          conn
            .model("bills")
            .find({
              isHidden: false,
              name: RegExp(data.keyword, "i"),
              $expr: {
                $and: [
                  { $eq: [{ $month: "$date" }, data.month + 1] },
                  { $eq: [{ $year: "$date" }, data.year] },
                ],
              },
            })
            .sort({
              date: -1,
            })
            .populate("createdBy", "name")
            .populate("memberID", "code name")
            .populate("storeID", "name")
            .sort({ date: -1 })
            .limit(20)
            .skip((data.page - 1) * 20),
          conn.model("bills").countDocuments({
            isHidden: false,
            name: RegExp(data.keyword, "i"),
            $expr: {
              $and: [
                { $eq: [{ $month: "$date" }, data.month + 1] },
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
              isHidden: false,
              name: RegExp(data.keyword, "i"),
              $expr: {
                $and: [
                  { $eq: [{ $month: "$date" }, data.month + 1] },
                  { $eq: [{ $year: "$date" }, data.year] },
                ],
              },
              storeID: {
                $in: data.storeID,
              },
            })
            .sort({
              date: -1,
            })
            .populate("createdBy", "name")
            .populate("memberID", "code name")
            .populate("storeID", "name")
            .sort({ date: -1 })
            .limit(20)
            .skip((data.page - 1) * 20),
          conn.model("bills").countDocuments({
            isHidden: false,
            name: RegExp(data.keyword, "i"),
            $expr: {
              $and: [
                { $eq: [{ $month: "$date" }, data.month + 1] },
                { $eq: [{ $year: "$date" }, data.year] },
              ],
            },
            storeID: {
              $in: data.storeID,
            },
          }),
        ]);
      }
    } else {
      if (data.storeID.length == 0) {
        return Promise.all([
          conn
            .model("bills")
            .find({
              name: RegExp(data.keyword, "i"),
              $expr: {
                $and: [
                  { $eq: [{ $month: "$date" }, data.month + 1] },
                  { $eq: [{ $year: "$date" }, data.year] },
                ],
              },
            })
            .sort({
              date: -1,
            })
            .populate("createdBy", "name")
            .populate("memberID", "code name")
            .populate("storeID", "name")
            .limit(20)
            .skip((data.page - 1) * 20),
          conn.model("bills").countDocuments({
            name: RegExp(data.keyword, "i"),
            $expr: {
              $and: [
                { $eq: [{ $month: "$date" }, data.month + 1] },
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
                  { $eq: [{ $month: "$date" }, data.month + 1] },
                  { $eq: [{ $year: "$date" }, data.year] },
                ],
              },
              storeID: {
                $in: data.storeID,
              },
            })
            .sort({
              date: -1,
            })
            .populate("createdBy", "name")
            .populate("memberID", "code name")
            .populate("storeID", "name")
            .limit(20)
            .skip((data.page - 1) * 20),
          conn.model("bills").countDocuments({
            name: RegExp(data.keyword, "i"),
            $expr: {
              $and: [
                { $eq: [{ $month: "$date" }, data.month + 1] },
                { $eq: [{ $year: "$date" }, data.year] },
              ],
            },
            storeID: {
              $in: data.storeID,
            },
          }),
        ]);
      }
    }
  }

  static fetchStore(data: StoreBillFetchInterface) {
    const page = data.page;
    const storeID = data.storeID;

    return Promise.all([
      conn
        .model("bills")
        .find({
          storeID: storeID,
          isDelete: false,
          // date is today
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        })
        .sort({
          date: -1,
        })
        .populate("createdBy", "name")
        .populate("memberID", "code name")
        .limit(20)
        .skip((page - 1) * 20),
      conn.model("bills").countDocuments({
        storeID: storeID,
        isDelete: false,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
    ]);
  }

  static fetchByID(id: string) {
    return conn
      .model("bills")
      .findById(id)
      .populate("memberID", "code name")
      .populate("createdBy", "name")
      .populate("items.itemID", "_id reference description");
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
      .populate("memberID", "_id code name")
      .populate("storeID", "name");
  }

  static fetchStoreReport(storeID: string) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    console.log(storeID);

    return conn.model("bills").find({
      storeID: storeID,
      isDelete: false,
      $and: [
        {
          date: {
            $gte: date,
          },
        },
        {
          date: {
            $lte: new Date(),
          },
        },
      ],
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
      .populate({
        path: "items.itemID",
        model: "items",
        select: "reference description _id itemTypeID", // add _id to retrieve the entire document
        populate: {
          path: "itemTypeID",
          select: "name",
        },
      })
      .populate("storeID", "name")
      .populate("memberID", "code")
      .populate("createdBy", "name");
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

  static updateReport(data: BillUpdateInterface[]) {
    return Promise.all(
      data.map((item) =>
        conn.model("bills").findByIdAndUpdate(item.id, {
          isHidden: item.isHidden,
        })
      )
    );
  }

  static deleteByID(data: BillDeleteInterface) {
    return conn.model("bills").findByIdAndUpdate(data.id, {
      isDelete: true,
      deletedBy: data.userID,
      deletedAt: new Date(),
    });
  }
}
export default BillModelModel;
