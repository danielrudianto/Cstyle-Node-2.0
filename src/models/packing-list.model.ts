import {
  PackingListFetchInterface,
  PackingListInterface,
  PackingListItem,
  PackingListStatus,
} from "../interfaces/packing-list.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class PackingListModelModel {
  id?: string;
  name?: string;
  date: Date;
  note: string;
  customerID: string;
  salesID: string;
  items: PackingListItem[];
  createdBy: string;
  createdAt?: Date;

  constructor(data: PackingListInterface) {
    this.id = data.id;
    this.name = data.name;
    this.date = data.date;
    this.note = data.note;
    this.customerID = data.customerID;
    this.salesID = data.salesID;
    this.items = data.items;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
  }

  create() {
    return conn.model("packing-lists").create({
      name: this.name,
      date: this.date,
      note: this.note,
      customerID: this.customerID,
      salesID: this.salesID,
      items: this.items,
      createdBy: this.createdBy,
      createdAt: new Date(),
    });
  }

  static fetch(data: PackingListFetchInterface) {
    const filters = [];
    if (data.status.includes(PackingListStatus.Active)) {
      filters.push({
        isDelete: false,
      });
    }

    if (data.status.includes(PackingListStatus.Deleted)) {
      filters.push({
        isDelete: true,
      });
    }

    return Promise.all([
      conn
        .model("packing-lists")
        .find({
          $or: filters,
          name: { $regex: data.keyword, $options: "i" },
          $expr: {
            $and: [
              { $eq: [{ $month: "$date" }, data.month] },
              { $eq: [{ $year: "$date" }, data.year] },
            ],
          },
        })
        .sort({ date: 1 })
        .populate("customerID")
        .populate("salesID", "name")
        .populate("createdBy", "name")
        .populate("deletedBy", "name")
        .limit(20)
        .skip((data.page - 1) * 20),
      conn.model("packing-lists").countDocuments({
        $or: filters,
        name: { $regex: data.keyword, $options: "i" },
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
      .model("packing-lists")
      .findById(id)
      .populate("items.itemID")
      .populate("customerID", "name address phoneNumber")
      .populate("salesID", "name");
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("packing-lists").findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  static preCreate(items: PackingListItem[]): PackingListItem[] {
    // Combine if it has the same price, discount, and itemID
    const modifiedItems: PackingListItem[] = [];
    for (let i = 0; i < items.length; i++) {
      if (
        modifiedItems.filter(
          (x) =>
            x.itemID == items[i].itemID &&
            x.price == items[i].price &&
            x.discount == items[i].discount
        ).length == 0
      ) {
        modifiedItems.push(items[i]);
      } else {
        modifiedItems[
          modifiedItems.findIndex(
            (x) =>
              x.itemID == items[i].itemID &&
              x.price == items[i].price &&
              x.discount == items[i].discount
          )
        ].quantity += items[i].quantity;
      }
    }
    return modifiedItems;
  }

  static async generateName(date: Date): Promise<string> {
    const count = await conn.model("packing-lists").countDocuments({
      $expr: {
        $and: [
          { $eq: [{ $month: "$date" }, date.getMonth() + 1] },
          { $eq: [{ $year: "$date" }, date.getFullYear()] },
        ],
      },
    });

    return (
      "PL-CS-" +
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      (count + 1).toString().padStart(4, "0")
    );
  }
}

export default PackingListModelModel;
