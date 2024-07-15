import {
  AdjustmentFetchInterface,
  AdjustmentInterface,
  AdjustmentItemInterface,
} from "../interfaces/adjustment.interface";
import { connectionFactory } from "../utils/connector.utils";
import StockModelModel from "./stock.model";

const conn = connectionFactory();
class AdjustmentModelModel {
  id?: string;
  name?: string;
  date: Date;
  createdBy: string;
  createdAt?: Date;
  items: AdjustmentItemInterface[];
  storeID: string | null;

  constructor(data: AdjustmentInterface) {
    this.id = data.id;
    this.name = data.name;
    this.date = data.date;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.items = data.items;
    this.storeID = data.storeID;
  }

  create() {
    return conn.model("adjustment-event").create({
      date: this.date,
      name: this.name,
      createdBy: this.createdBy,
      createdAt: new Date(),
      items: this.items,
      storeID: this.storeID,
    });
  }

  static fetch(data: AdjustmentFetchInterface) {
    const filter = [];

    if (data.status.includes("active")) {
      filter.push({
        isDelete: false,
      });
    }

    if (data.status.includes("deleted")) {
      filter.push({
        isDelete: true,
      });
    }

    return Promise.all([
      conn
        .model("adjustment-event")
        .find({
          $or: filter,
          name: RegExp(data.keyword, "i"),
          $expr: {
            $and: [
              { $eq: [{ $month: "$date" }, data.month] },
              { $eq: [{ $year: "$date" }, data.year] },
            ],
          },
        })
        .populate("storeID", "name")
        .populate("createdBy", "name")
        .sort({
          createdAt: -1,
        })
        .limit(20)
        .skip(20 * (data.page - 1)),
      conn.model("adjustment-event").countDocuments({
        $or: filter,
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

  static fetchByID(id: string) {
    return conn
      .model("adjustment-event")
      .findById(id)
      .populate("createdBy", "name")
      .populate("deletedBy", "name")
      .populate("storeID", "name")
      .populate("items.itemID", "reference description");
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("adjustment-event").findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  static async preCreate(
    data: { id: string; quantity: number }[],
    storeID: string | null
  ): Promise<boolean> {
    const negativeItems = data.filter((x) => x.quantity < 0);
    const result = await StockModelModel.checkStockByItemIDs(
      negativeItems.map((x) => {
        return {
          itemID: x.id,
          quantity: x.quantity * -1,
        };
      }),
      storeID
    );

    let validation = true;
    for (let i = 0; i < negativeItems.length; i++) {
      const x = negativeItems[i];
      const stockIndex = result.findIndex((y) => y.itemID.toString() == x.id);

      if (stockIndex == -1 || result[stockIndex].quantity < x.quantity * -1) {
        validation = false;
        break; // exit the loop if validation is false
      }
    }

    return validation;
  }

  static async generateName(date: Date): Promise<string> {
    try {
      const count = await conn.model("adjustment-event").countDocuments({
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, date.getMonth() + 1] },
            { $eq: [{ $year: "$date" }, date.getFullYear()] },
          ],
        },
      });

      return `ADJ-${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${(count + 1).toString().padStart(4, "0")}`;
    } catch (error) {
      throw error;
    }
  }
}

export default AdjustmentModelModel;
