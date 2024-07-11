import { MembershipInterface } from "../interfaces/membership.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class MembershipModelModel {
  name: string;
  code: string;
  point: number;
  email: string | null;
  phoneNumber: string | null;
  nationality: string | null;
  language: string;
  id?: string;
  createdBy: string;
  createdAt?: Date;
  birthday: Date;
  storeID: string;

  constructor(data: MembershipInterface) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
    this.point = data.point;
    this.email = data.email;
    this.phoneNumber = data.phoneNumber;
    this.nationality = data.nationality;
    this.language = data.language;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.birthday = data.birthday;
    this.storeID = data.storeID;
  }

  create() {
    return conn.model("memberships").create({
      name: this.name,
      code: this.code,
      point: this.point,
      email: this.email,
      phoneNumber: this.phoneNumber,
      nationality: this.nationality,
      language: this.language,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
    });
  }

  static fetchByIDs(ids: string[]) {
    return conn.model("memberships").find({
      code: {
        $in: ids,
      },
    });
  }

  static count() {
    return Promise.all([
      conn.model("memberships").aggregate([
        {
          $group: {
            _id: "$storeID",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $lookup: {
            from: "stores",
            localField: "_id",
            foreignField: "_id",
            as: "store",
          },
        },
        {
          $unwind: {
            path: "$store",
          },
        },
      ]),
      conn.model("memberships").aggregate([
        {
          $group: {
            _id: "$nationality",
            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);
  }

  static countNewMembers() {
    return conn.model("memberships").countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  static updatePoint(memberID: string, point: number) {
    return conn.model("memberships").findByIdAndUpdate(memberID, {
      $inc: {
        point: point,
      },
    });
  }

  static fetchByCode(code: string) {
    return conn.model("memberships").findOne({
      code: code,
    });
  }

  static async preCreate(code: string) {
    const count = await conn.model("memberships").countDocuments({
      code: code,
    });

    return count == 0;
  }
}

export default MembershipModelModel;
