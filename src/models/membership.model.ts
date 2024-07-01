import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class MembershipModelModel {
  static fetchByIDs(ids: string[]) {
    return conn.model("memberships").find({
      code: {
        $in: ids,
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
}

export default MembershipModelModel;
