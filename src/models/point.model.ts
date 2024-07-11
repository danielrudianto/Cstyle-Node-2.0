import { MembershipPointInterface } from "../interfaces/membership.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class MembershipPointModelModel {
  id?: string;
  conversion: number;
  createdBy: string;
  createdAt?: Date;

  constructor(data: MembershipPointInterface) {
    this.id = data.id;
    this.conversion = data.conversion;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
  }

  create() {
    return conn.model("membership-points").create({
      conversion: this.conversion,
      createdBy: this.createdBy,
      createdAt: new Date(),
    });
  }

  static fetch(page: number) {
    return Promise.all([
      conn
        .model("membership-points")
        .find({})
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .skip((page - 1) * 10),
      conn.model("membership-points").countDocuments({}),
    ]);
  }

  static fetchCurrentConversion() {
    return conn.model("membership-points").findOne({}).sort({
      createdAt: -1,
    });
  }

  static async preCreate(conversion: number): Promise<boolean> {
    // Check if previous conversion is the same as this one
    const currentConversion = await this.fetchCurrentConversion();
    if (currentConversion == null) {
      return true;
    } else if (currentConversion.conversion != conversion) {
      return true;
    } else {
      return false;
    }
  }
}

export default MembershipPointModelModel;
