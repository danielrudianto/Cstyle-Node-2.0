import { connectionFactory } from "../utils/connector.utils";
import {
  createStockTransferInterface,
  createStockTransferItemInterface,
  precreateStockTransferInterface,
  StockTransferFetchInterface,
  StockTransferSendInterface,
} from "../interfaces/stock-request.interface";

const conn = connectionFactory();
class StockRequestModelModel {
  id?: string;
  name: string;
  date: Date;
  createdBy: string;
  createdAt: Date;
  requestFrom: string | null;
  requestTo: string | null;
  items: createStockTransferItemInterface[];
  note: string;
  isConfirm: boolean;
  isReject: boolean;
  isDelete: boolean;
  isSending: boolean;
  rejectNote: string | null;

  constructor(data: createStockTransferInterface) {
    this.name = data.name;
    this.date = data.date;
    this.items = data.items;
    this.note = data.note;
    this.createdBy = data.createdBy;
    this.createdAt = new Date();
    this.requestFrom = data.requestFrom;
    this.requestTo = data.requestTo;
    this.isSending = false;
    this.isConfirm = false;
    this.isReject = false;
    this.isDelete = false;
    this.rejectNote = null;
  }

  create() {
    return conn.model("stock-requests").create({
      name: this.name,
      date: this.date,
      items: this.items,
      note: this.note,
      createdBy: this.createdBy,
      createdAt: new Date(),
      requestFrom: this.requestFrom,
      requestTo: this.requestTo,
      isSending: false,
      isConfirm: false,
      isReject: false,
      isDelete: false,
      rejectNote: null,
    });
  }

  static fetch(data: StockTransferFetchInterface) {
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

    if (data.status.includes("sending")) {
      filter.push({
        $and: [
          {
            isDelete: false,
          },
          {
            isSending: true,
          },
        ],
      });
    }

    if (data.status.includes("rejected")) {
      filter.push({
        $and: [
          {
            isDelete: false,
          },
          {
            isReject: true,
          },
        ],
      });
    }

    if (data.status.includes("received")) {
      filter.push({
        $and: [
          {
            isDelete: false,
          },
          {
            isConfirm: true,
          },
        ],
      });
    }

    return Promise.all([
      conn
        .model("stock-requests")
        .find({
          $or: [...filter],
          $expr: {
            $and: [
              { $eq: [{ $month: "$createdAt" }, data.month] },
              { $eq: [{ $year: "$createdAt" }, data.year] },
            ],
          },
          name: { $regex: RegExp(data.keyword, "i") },
        })
        .populate("requestFrom", "name address")
        .populate("requestTo", "name address")
        .populate("createdBy", "name")
        .skip((data.page - 1) * 10)
        .limit(10)
        .sort({
          createdAt: -1,
        }),
      conn.model("stock-requests").countDocuments({
        $or: [...filter],
        $expr: {
          $and: [
            { $eq: [{ $month: "$createdAt" }, data.month] },
            { $eq: [{ $year: "$createdAt" }, data.year] },
          ],
        },
        name: { $regex: RegExp(data.keyword, "i") },
      }),
    ]);
  }

  static fetchByID(id: string) {
    return conn
      .model("stock-requests")
      .findById(id)
      .populate("createdBy", "name")
      .populate("requestFrom", "name address")
      .populate("requestTo", "name address")
      .populate("sendBy", "name")
      .populate("deletedBy", "name")
      .populate("updatedBy", "name")
      .populate("items.itemID", "reference description");
  }

  static fetchUnsent(page: number, storeID: string | null) {
    return Promise.all([
      conn
        .model("stock-requests")
        .find({
          isDelete: false,
          isSending: false,
          requestTo: storeID,
          isConfirm: false,
          isReject: false,
        })
        .populate("requestFrom", "name address")
        .populate("requestTo", "name address")
        .populate("createdBy", "name")
        .select("_id name createdAt requestFrom requestTo createdBy")
        .limit(10)
        .skip((page - 1) * 10)
        .sort({ createdAt: -1 }),
      conn.model("stock-requests").countDocuments({
        isDelete: false,
        isSending: false,
        requestTo: storeID,
      }),
    ]);
  }

  static fetchUnreceived(page: number, storeID: string | null) {
    return Promise.all([
      conn
        .model("stock-requests")
        .find({
          isDelete: false,
          requestFrom: storeID,
          isSending: true,
          isConfirm: false,
          isReject: false,
        })
        .populate("requestFrom", "name address")
        .populate("requestTo", "name address")
        .populate("createdBy", "name")
        .select("name createdAt requestFrom requestTo createdBy")
        .limit(10)
        .skip((page - 1) * 10)
        .sort({ createdAt: -1 }),
      conn.model("stock-requests").countDocuments({
        isDelete: false,
        requestFrom: storeID,
        isSending: true,
        isConfirm: false,
        isReject: false,
      }),
    ]);
  }

  static send(data: StockTransferSendInterface) {
    return conn
      .model("stock-requests")
      .findByIdAndUpdate(data.id, {
        items: data.items,
        isSending: true,
        sendBy: data.createdBy,
      })
      .populate("requestFrom", "name address")
      .populate("requestTo", "name address")
      .populate("createdBy", "name")
      .populate("sendBy", "name")
      .populate("deletedBy", "name")
      .populate("updatedBy", "name")
      .populate("items.itemID", "reference description");
  }

  static confirmByID(id: string, userID: string) {
    return conn.model("stock-requests").findByIdAndUpdate(id, {
      isConfirm: true,
      updatedBy: userID,
      updatedAt: new Date(),
    });
  }

  static rejectByID(id: string, userID: string, note: string) {
    return conn.model("stock-requests").findByIdAndUpdate(id, {
      isReject: true,
      updatedBy: userID,
      updatedAt: new Date(),
      rejectNote: note,
    });
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("stock-requests").findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  static async preCreate(
    data: precreateStockTransferInterface
  ): Promise<number> {
    try {
      const count = await conn.model("stock-requests").countDocuments({
        $expr: {
          $and: [
            {
              $eq: [{ $month: "$createdAt" }, data.month],
            },
            {
              $eq: [{ $year: "$createdAt" }, data.year],
            },
          ],
        },
      });
      return count;
    } catch (error) {
      throw error;
    }
  }
}

export default StockRequestModelModel;
