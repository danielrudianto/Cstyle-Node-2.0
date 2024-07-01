import QuotationModel from "../schemas/ins.quotation.model";
import {
  QuotationItemInteface,
  QuotationInterface,
  QuotationSearchInterface,
  QuotationStatus,
} from "../interfaces/quotation.interface";
import moment from "moment";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class QuotationModelModel {
  date: Date;
  expiryDate: Date;
  name?: string;
  customerID?: string;
  note?: string;
  createdBy: string;
  createdAt: Date;
  items?: QuotationItemInteface[];

  constructor(data: QuotationInterface) {
    this.date = data.date;
    this.expiryDate = data.expiryDate;
    this.name = data.name;
    this.customerID = data.customerID;
    this.note = data.note;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.items = data.items;
  }

  create() {
    return conn.model("quotations").create({
      date: this.date,
      expiryDate: this.expiryDate,
      name: this.name,
      customerID: this.customerID,
      note: this.note,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      items: this.items,
    });
  }

  static search(data: QuotationSearchInterface) {
    const filters = [];
    if (data.status.includes(QuotationStatus.Active)) {
      filters.push({
        isDelete: false,
        expiryDate: { $gte: moment(new Date()).format("YYYY-MM-DD") },
      });
    }

    if (data.status.includes(QuotationStatus.Expired)) {
      filters.push({
        isDelete: false,
        expiryDate: { $lt: moment(new Date()).format("YYYY-MM-DD") },
      });
    }

    if (data.status.includes(QuotationStatus.Canceled)) {
      filters.push({
        isDelete: true,
      });
    }

    return Promise.all([
      conn
        .model("quotations")
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
        .select("date name expiryDate createdAt isDelete")
        .populate("customerID", "name")
        .populate("createdBy", "name")
        .populate("deletedBy", "name")
        .limit(20)
        .skip((data.page - 1) * 20),
      conn.model("quotations").countDocuments({
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

  static fetchByID(id: string) {
    return conn
      .model("quotations")
      .findById(id)
      .populate("customerID")
      .populate("items.itemID", "reference description")
      .populate("createdBy", "name")
      .populate("deletedBy", "name");
  }

  static countDocumentByMonthYear(month: number, year: number) {
    return conn.model("quotations").countDocuments({
      $expr: {
        $and: [
          { $eq: [{ $month: "$date" }, month + 1] },
          { $eq: [{ $year: "$date" }, year] },
        ],
      },
    });
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("quotations").findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }
}

export default QuotationModelModel;
