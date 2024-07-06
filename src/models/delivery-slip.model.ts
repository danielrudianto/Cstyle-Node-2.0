import { connectionFactory } from "../utils/connector.utils";
import {
  DeliverySlipInterface,
  DeliverySlipItem,
} from "../interfaces/delivery-slip.interface";

const conn = connectionFactory();
class DeliverySlipModelModel {
  id?: string;
  name: string;
  date: Date;
  customerID: string;
  salesID: string;
  items: DeliverySlipItem[];
  createdBy: string;
  createdAt?: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;

  constructor(data: DeliverySlipInterface) {
    this.id = data.id;
    this.name = data.name;
    this.date = data.date;
    this.customerID = data.customerID;
    this.salesID = data.salesID;
    this.items = data.items;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  create() {
    return conn.model("delivery-slip").create({
      name: this.name,
      date: this.date,
      customerID: this.customerID,
      salesID: this.salesID,
      items: this.items,
      createdBy: this.createdBy,
      createdAt: new Date(),
    });
  }

  static async generateName(date: Date): Promise<string> {
    const count = await conn.model("packing-list").countDocuments({
      $expr: {
        $and: [
          { $eq: [{ $month: "$date" }, date.getMonth() + 1] },
          { $eq: [{ $year: "$date" }, date.getFullYear()] },
        ],
      },
    });

    return (
      "DS-CS-" +
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      (count + 1).toString().padStart(4, "0")
    );
  }

  static preCreate(items: DeliverySlipItem[]): DeliverySlipItem[] {
    // Combine if it has the same price, discount, and itemID
    const modifiedItems: DeliverySlipItem[] = [];
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
}

export default DeliverySlipModelModel;
