import {
  InvoiceFetchInterface,
  InvoiceInterface,
} from "../interfaces/invoice.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class InvoiceModelModel {
  id?: string;
  name: string;
  date: Date;
  note: string;
  dueDate: Date;
  packingListID: string | null;
  deliverySlipID: string | null;
  createdBy: string;
  createdAt?: Date;
  customerID: string;
  salesID: String;
  isHidden?: boolean;
  isDelete?: boolean;
  deletedBy?: string;
  deletedAt?: Date;

  constructor(data: InvoiceInterface) {
    this.name = data.name;
    this.date = data.date;
    this.note = data.note;
    this.dueDate = data.dueDate;
    this.packingListID = data.packingListID;
    this.deliverySlipID = data.deliverySlipID;
    this.createdBy = data.createdBy;
    this.customerID = data.customerID;
    this.salesID = data.salesID;
    this.isHidden = data.isHidden;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  create() {
    return conn.model("invoices").create({
      name: this.name,
      date: this.date,
      note: this.note,
      dueDate: this.dueDate,
      packingListID: this.packingListID,
      deliverySlipID: this.deliverySlipID,
      createdBy: this.createdBy,
      createdAt: new Date(),
      customerID: this.customerID,
      salesID: this.salesID,
    });
  }

  static fetch(data: InvoiceFetchInterface) {
    const filters = [];

    if (data.status.includes("active")) {
      filters.push({
        isDelete: false,
      });
    }

    if (data.status.includes("deleted")) {
      filters.push({
        isDelete: true,
      });
    }
    return Promise.all([
      conn
        .model("invoices")
        .find({
          $or: filters,
          $expr: {
            $and: [
              { $eq: [{ $month: "$date" }, data.month] },
              { $eq: [{ $year: "$date" }, data.year] },
            ],
          },
        })
        .populate("customerID", "name")
        .populate("salesID", "name")
        .populate("createdBy", "name")
        .sort({
          date: 1,
        })
        .limit(10)
        .skip(10 * (data.page - 1)),
      conn.model("invoices").countDocuments({
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
      .model("invoices")
      .findById(id)
      .populate("customerID", "name address phoneNumber")
      .populate("salesID", "name")
      .populate("createdBy", "name")
      .populate("packingListID")
      .populate("deliverySlipID");
  }

  static fetchByPackingListID(id: string) {
    return conn.model("invoices").findOne({
      packingListID: id,
    });
  }

  static fetchByDeliverySlipID(id: string) {
    return conn.model("invoices").findOne({
      deliverySlipID: id,
    });
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("invoices").findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  static async generateName(date: Date): Promise<string> {
    const count = await conn.model("invoices").countDocuments({
      $expr: {
        $and: [
          { $eq: [{ $month: "$date" }, date.getMonth() + 1] },
          { $eq: [{ $year: "$date" }, date.getFullYear()] },
        ],
      },
    });

    return (
      "INV-CS-" +
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      (count + 1).toString().padStart(4, "0")
    );
  }
}

export default InvoiceModelModel;
