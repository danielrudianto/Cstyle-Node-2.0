import { FetchInterface } from "../interfaces/fetch.interface";
import {
  GoodReceiptCreateInterface,
  GoodReceiptItemInterface,
  GoodReceiptSearchInterface,
  GoodReceiptStatus,
} from "../interfaces/good-receipt.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

export class GoodReceiptCreateModel {
  id?: string;
  name: string;
  date: Date;
  supplier: string;
  createdBy: string;
  items: GoodReceiptItemInterface[];

  constructor(data: GoodReceiptCreateInterface) {
    (this.id = data.id), (this.name = data.name);
    this.date = data.date;
    this.supplier = data.supplierID;
    this.items = data.items;
    this.createdBy = data.createdBy;
  }

  create() {
    return conn.model("good-receipt").create({
      name: this.name,
      date: this.date,
      supplierID: this.supplier,
      items: this.items,
      createdBy: this.createdBy,
      createdAt: new Date(),
    });
  }

  update() {
    return conn.model("good-receipt").findByIdAndUpdate(this.id, {
      name: this.name,
      date: this.date,
      supplierID: this.supplier,
      items: this.items,
    });
  }
}

export class GoodReceiptModelModel {
  static fetchByID(id: string) {
    return conn
      .model("good-receipt")
      .findById(id)
      .populate("items.itemID", "reference description")
      .populate("supplierID", "name address");
  }

  static fetch(data: GoodReceiptSearchInterface) {
    const filters = [];
    if (data.status.includes(GoodReceiptStatus.Active)) {
      filters.push({
        isDelete: false,
      });
    }

    if (data.status.includes(GoodReceiptStatus.Deleted)) {
      filters.push({
        isDelete: true,
      });
    }

    return Promise.all([
      conn
        .model("good-receipt")
        .find({
          name: {
            $regex: new RegExp(data.keyword, "i"),
          },
          $or: filters,
          $expr: {
            $and: [
              { $eq: [{ $month: "$date" }, data.month] },
              { $eq: [{ $year: "$date" }, data.year] },
            ],
          },
        })
        .sort({ date: 1 })
        .select("date name createdAt isDelete")
        .populate("supplierID", "name")
        .populate("createdBy", "name")
        .populate("deletedBy", "name")
        .limit(20)
        .skip((data.page - 1) * 20),
      conn.model("good-receipt").countDocuments({
        name: {
          $regex: new RegExp(data.keyword, "i"),
        },
        $or: filters,
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, data.month] },
            { $eq: [{ $year: "$date" }, data.year] },
          ],
        },
      }),
    ]);
  }

  static fetchReport(month: number, year: number) {
    return conn
      .model("good-receipt")
      .find({
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, month] },
            { $eq: [{ $year: "$date" }, year] },
            { $eq: ["$isDelete", false] },
          ],
        },
      })
      .populate("supplierID", "name")
      .populate("createdBy", "name")
      .sort({
        date: 1,
      });
  }

  static fetchProductReport(month: number, year: number) {
    return conn
      .model("good-receipt")
      .find({
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, month] },
            { $eq: [{ $year: "$date" }, year] },
            { $eq: ["$isDelete", false] },
          ],
        },
      })
      .populate("supplierID", "name")
      .populate("items.itemID", "reference description");
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("good-receipt").findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }
}
