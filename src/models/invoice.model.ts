import {
  InvoiceFetchInterface,
  InvoiceInterface,
  InvoiceUpdateInterface,
  UpdateInvoicePaymentInterface,
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
    const paymentFilters = [];

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

    if (data.paymentStatus.includes("paid")) {
      paymentFilters.push({
        isPaid: true,
      });
    }

    if (data.paymentStatus.includes("unpaid")) {
      paymentFilters.push({
        isPaid: false,
      });
    }

    console.log(data.keyword);
    console.log(data.month);
    console.log(data.year);
    console.log(paymentFilters);
    console.log(filters);

    return Promise.all([
      conn
        .model("invoices")
        .find({
          $and: [
            {
              $or: filters,
            },
            {
              $or: paymentFilters,
            },
          ],
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
        .limit(20)
        .skip(20 * (data.page - 1)),
      conn.model("invoices").countDocuments({
        $and: [
          {
            $or: filters,
          },
          {
            $or: paymentFilters,
          },
        ],
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, data.month] },
            { $eq: [{ $year: "$date" }, data.year] },
          ],
        },
      }),
    ]);
  }

  static fetchReport(month: number, year: number, shownOnly: boolean = true) {
    let query: any = {
      $expr: {
        $and: [
          { $eq: [{ $month: "$date" }, month] },
          { $eq: [{ $year: "$date" }, year] },
        ],
      },
    };

    if (shownOnly) {
      query.isHidden = false;
    }

    return conn
      .model("invoices")
      .find(query)
      .populate("customerID", "name")
      .populate("salesID", "name")
      .populate("createdBy", "name")
      .populate("packingListID");
  }

  static fetchProductReport(
    month: number,
    year: number,
    shownOnly: boolean = true
  ) {
    if (shownOnly) {
      return conn
        .model("invoices")
        .find({
          $expr: {
            $and: [
              { $eq: [{ $month: "$date" }, month] },
              { $eq: [{ $year: "$date" }, year] },
            ],
          },
          isHidden: false,
        })
        .populate({
          path: "packingListID",
          populate: {
            path: "items.itemID",
            model: "items",
            select: "reference description _id", // add _id to retrieve the entire document
          },
        })
        .populate({
          path: "deliverySlipID",
          populate: {
            path: "items.itemID",
            model: "items",
            select: "reference description _id", // add _id to retrieve the entire document
          },
        })
        .populate("packingListID.customerID", "name")
        .populate("deliverySlipID.customerID", "name");
    } else {
      return conn
        .model("invoices")
        .find({
          $expr: {
            $and: [
              { $eq: [{ $month: "$date" }, month] },
              { $eq: [{ $year: "$date" }, year] },
            ],
          },
        })
        .populate({
          path: "packingListID",
          populate: {
            path: "items.itemID",
            model: "items",
            select: "reference description _id", // add _id to retrieve the entire document
          },
        })
        .populate({
          path: "deliverySlipID",
          populate: {
            path: "items.itemID",
            model: "items",
            select: "reference description _id", // add _id to retrieve the entire document
          },
        })
        .populate("packingListID.customerID", "name")
        .populate("deliverySlipID.customerID", "name");
    }
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

  static updatePayment(data: UpdateInvoicePaymentInterface) {
    return conn.model("invoices").findByIdAndUpdate(data.id, {
      payments: [
        {
          paidAt: data.paidAt,
          paidBy: data.paidBy,
          paymentMethod: data.paymentMethod,
          amount: data.amount,
        },
      ],
      isPaid: true,
    });
  }

  static updateReport(data: InvoiceUpdateInterface[]) {
    return Promise.all(
      data.map((item) =>
        conn.model("invoices").findByIdAndUpdate(item.id, {
          isHidden: item.isHidden,
        })
      )
    );
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("invoices").findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  static deletePaymentByID(id: string) {
    return conn.model("invoices").findByIdAndUpdate(id, {
      isPaid: false,
      payments: [],
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
