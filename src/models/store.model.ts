import { ErrorList } from "../data/error-list";
import { FetchInterface } from "../interfaces/fetch.interface";
import {
  StoreInterface,
  StoreUpdateInterface,
} from "../interfaces/store.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class StoreModelModel {
  id?: string;
  name: string;
  prefix: string;
  address: string;
  phoneNumber: string;
  code?: string;
  createdBy?: string;
  createdAt?: Date;

  constructor(data: StoreInterface) {
    this.id = data.id;
    this.name = data.name;
    this.prefix = data.prefix;
    this.address = data.address;
    this.phoneNumber = data.phoneNumber;
    this.code = data.code;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
  }

  create() {
    return conn.model("stores").create({
      name: this.name,
      prefix: this.prefix,
      address: this.address,
      phoneNumber: this.phoneNumber,
      code: this.code,
      createdBy: this.createdBy,
      createdAt: new Date(),
    });
  }

  update() {
    return conn.model("stores").findByIdAndUpdate(this.id, {
      name: this.name,
      prefix: this.prefix,
      address: this.address,
      phoneNumber: this.phoneNumber,
      code: this.code,
    });
  }

  static fetch(data: FetchInterface) {
    return Promise.all([
      conn
        .model("stores")
        .find({
          $or: [
            {
              name: {
                $regex: new RegExp(data.keyword, "i"),
              },
            },
            {
              prefix: {
                $regex: new RegExp(data.keyword, "i"),
              },
            },
            {
              phoneNumber: {
                $regex: new RegExp(data.keyword, "i"),
              },
            },
            {
              address: {
                $regex: new RegExp(data.keyword, "i"),
              },
            },
          ],
        })
        .skip((data.page - 1) * 20)
        .limit(20)
        .sort({ name: 1 }),
      conn.model("stores").countDocuments({
        $or: [
          {
            name: {
              $regex: new RegExp(data.keyword, "i"),
            },
          },
          {
            prefix: {
              $regex: new RegExp(data.keyword, "i"),
            },
          },
          {
            phoneNumber: {
              $regex: new RegExp(data.keyword, "i"),
            },
          },
          {
            address: {
              $regex: new RegExp(data.keyword, "i"),
            },
          },
        ],
      }),
    ]);
  }

  static fetchOthers(storeID: string) {
    return conn
      .model("stores")
      .find({
        _id: {
          $ne: storeID,
        },
        isActive: true,
      })
      .sort({
        name: 1,
      });
  }

  static async fetchByCode(code: string): Promise<StoreModelModel> {
    const store = await conn
      .model("stores")
      .find({ code: code, isActive: true });
    if (store.length == 0) {
      throw Error(ErrorList["STORE_NOT_FOUND"]);
    } else {
      return new StoreModelModel(store[0]);
    }
  }

  static fetchAutocomplete(keyword: string) {
    return conn.model("stores").find({
      name: {
        $regex: new RegExp(keyword, "i"),
      },
      isActive: true,
    });
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("stores").findByIdAndUpdate(id, {
      isActive: false,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  static fetchByID(id: string) {
    return conn.model("stores").findById(id);
  }

  static async preCreate(data: StoreInterface): Promise<boolean> {
    const count = await conn.model("stores").countDocuments({
      $or: [
        {
          name: data.name,
        },
        {
          prefix: data.prefix,
        },
        {
          code: data.code,
        },
      ],
    });

    return count == 0;
  }

  static async preUpdate(data: StoreUpdateInterface): Promise<boolean> {
    const count = await conn.model("stores").countDocuments({
      $or: [
        {
          name: data.name,
        },
        {
          prefix: data.prefix,
        },
      ],
      _id: {
        $ne: data.id,
      },
    });

    return count == 0;
  }
}

export default StoreModelModel;
