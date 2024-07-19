import { FetchInterface } from "../interfaces/fetch.interface";
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

  update() {
    return conn.model("memberships").findByIdAndUpdate(this.id, {
      name: this.name,
      point: this.point,
      email: this.email,
      phoneNumber: this.phoneNumber,
      nationality: this.nationality,
      language: this.language,
    });
  }

  static fetch(data: FetchInterface) {
    return Promise.all([
      conn
        .model("memberships")
        .find({
          $or: [
            {
              name: {
                $regex: data.keyword,
                $options: "i",
              },
            },
            {
              code: {
                $regex: data.keyword,
                $options: "i",
              },
            },
            {
              nationality: {
                $regex: data.keyword,
                $options: "i",
              },
            },
          ],
        })
        .populate("storeID", "name")
        .sort({ name: 1 })
        .limit(20)
        .skip((data.page - 1) * 20),
      conn.model("memberships").countDocuments({
        $or: [
          {
            name: {
              $regex: data.keyword,
              $options: "i",
            },
          },
          {
            code: {
              $regex: data.keyword,
              $options: "i",
            },
          },
          {
            nationality: {
              $regex: data.keyword,
              $options: "i",
            },
          },
        ],
      }),
    ]);
  }

  static fetchByID(id: string) {
    return conn.model("memberships").findById(id).populate("storeID", "name");
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

  static countNewMembers(storeID: string | null = null) {
    if (storeID == null) {
      return conn.model("memberships").countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      return conn.model("memberships").countDocuments({
        storeID: storeID,
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  static countMembers(storeID: string | null = null) {
    if (storeID == null) {
      return conn.model("memberships").countDocuments();
    } else {
      return conn.model("memberships").countDocuments({
        storeID: storeID,
      });
    }
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

  static preUpdate(id: string) {
    return conn.model("memberships").findById(id);
  }
}

export default MembershipModelModel;
