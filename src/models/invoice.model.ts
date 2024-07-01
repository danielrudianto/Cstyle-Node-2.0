import { InvoiceInterface } from "../interfaces/invoice.interface";
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
    return conn.model("invoice").create({
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

  static fetchByPackingListID(id: string) {
    return conn.model("invoice").findOne({
      packingListID: id,
    });
  }

  static async generateName(date: Date): Promise<string> {
    const count = await conn.model("invoice").countDocuments({
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
