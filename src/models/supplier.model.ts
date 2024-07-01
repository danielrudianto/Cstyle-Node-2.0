import { FetchInterface } from "../interfaces/fetch.interface";
import {
  PreUpdateSupplierInterface,
  SupplierModelInterface,
} from "../interfaces/supplier.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class SupplierModelModel {
  id?: string;
  name: string;
  address: string;
  phoneNumber: string;
  npwp: string;
  email: string;
  createdBy: string;
  createdAt?: Date;
  isDelete?: boolean;
  deletedBy?: string;
  deletedAt?: Date;

  constructor(data: SupplierModelInterface) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.phoneNumber = data.phoneNumber;
    this.npwp = data.npwp;
    this.email = data.email;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.isDelete = data.isDelete;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  create() {
    return conn.model("suppliers").create({
      name: this.name,
      address: this.address,
      phoneNumber: this.phoneNumber,
      npwp: this.npwp,
      email: this.email,
      createdBy: this.createdBy,
      createdAt: new Date(),
    });
  }

  static fetch(data: FetchInterface) {
    return Promise.all([
      conn
        .model("suppliers")
        .find({
          isDelete: false,
          $or: [
            {
              name: {
                $regex: data.keyword,
                $options: "i",
              },
            },
            {
              address: {
                $regex: data.keyword,
                $options: "i",
              },
            },
            {
              phoneNumber: {
                $regex: data.keyword,
                $options: "i",
              },
            },
            {
              npwp: {
                $regex: data.keyword,
                $options: "i",
              },
            },
          ],
        })
        .skip((data.page - 1) * 20)
        .limit(20)
        .sort({ name: 1 }),
      conn.model("suppliers").countDocuments({
        isDelete: false,
        $or: [
          {
            name: {
              $regex: data.keyword,
              $options: "i",
            },
          },
          {
            address: {
              $regex: data.keyword,
              $options: "i",
            },
          },
          {
            phoneNumber: {
              $regex: data.keyword,
              $options: "i",
            },
          },
          {
            npwp: {
              $regex: data.keyword,
              $options: "i",
            },
          },
        ],
      }),
    ]);
  }

  static fetchByID(id: string) {
    return conn.model("suppliers").findById(id);
  }

  static fetchAutocomplete(keyword: string) {
    return conn
      .model("suppliers")
      .find({
        name: {
          $regex: new RegExp(keyword, "i"),
        },
        isDelete: false,
      })
      .limit(5)
      .skip(0)
      .sort({ name: 1 });
  }

  update() {
    return conn.model("suppliers").findByIdAndUpdate(this.id, {
      name: this.name,
      address: this.address,
      phoneNumber: this.phoneNumber,
      npwp: this.npwp,
      email: this.email,
    });
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("suppliers").findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  static async preCreate(name: string): Promise<boolean> {
    const count = await conn.model("suppliers").countDocuments({
      name: name,
      isDelete: false,
    });

    return count === 0;
  }

  static async preUpdate(data: PreUpdateSupplierInterface): Promise<boolean> {
    const count = await conn.model("suppliers").countDocuments({
      name: data.name,
      isDelete: false,
      _id: { $ne: data.id },
    });

    return count === 0;
  }

  static async preDelete(id: string): Promise<boolean> {
    const count = await conn.model("suppliers").countDocuments({
      _id: id,
      isDelete: false,
    });

    return count === 1;
  }
}

export default SupplierModelModel;
