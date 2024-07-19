import { FetchInterface } from "../interfaces/fetch.interface";
import { CustomerInterface } from "../interfaces/customer.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class CustomerModelModel {
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  type?: string;
  createdBy?: string;
  createdAt?: Date;
  email?: string;
  npwp?: string;

  constructor(data: CustomerInterface) {
    this.name = data.name;
    this.address = data.address;
    this.phone = data.phone;
    this.type = data.type;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.id = data.id;
    this.email = data.email;
    this.npwp = data.npwp;
  }

  create() {
    return conn.model("customer").create({
      name: this.name,
      address: this.address,
      phoneNumber: this.phone,
      type: this.type,
      createdBy: this.createdBy!,
      createdAt: new Date(),
      email: this.email,
      npwp: this.npwp,
    });
  }

  update() {
    return conn.model("customer").findByIdAndUpdate(this.id, {
      name: this.name,
      address: this.address,
      phoneNumber: this.phone,
      type: this.type,
      createdBy: this.createdBy!,
      createdAt: new Date(),
      email: this.email,
      npwp: this.npwp,
    });
  }

  static fetchV2(data: FetchInterface) {
    return Promise.all([
      conn
        .model("customer")
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
              type: {
                $regex: data.keyword,
                $options: "i",
              },
            },
            {
              email: {
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
        .sort({
          name: 1,
        })
        .skip((data.page - 1) * 20)
        .limit(20),
      conn.model("customer").countDocuments({
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
            type: {
              $regex: data.keyword,
              $options: "i",
            },
          },
          {
            email: {
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

  static fetchAutocomplete(keyword: string, type: string) {
    if (type == "bulk" || type == "consignment") {
      return conn
        .model("customer")
        .find({
          isDelete: false,
          name: {
            $regex: new RegExp(keyword, "i"),
          },
          type: type,
        })
        .limit(5)
        .populate("_id name");
    } else {
      return new Promise((resolve, reject) => {
        resolve([]);
      });
    }
  }

  static fetchByID(id: string) {
    return conn.model("customer").findById(id);
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("customer").findByIdAndUpdate(id, {
      isDelete: true,
      deletedAt: new Date(),
      deletedBy: userID,
    });
  }
}

export default CustomerModelModel;
