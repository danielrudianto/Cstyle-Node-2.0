import UserModel from "../schemas/ins.user.model";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class UserSalesModel {
  name: string;
  _id: string;

  constructor(name: string, _id: string) {
    this.name = name;
    this._id = _id;
  }

  static async fetchAutocomplete(keyword: string): Promise<UserSalesModel[]> {
    const users = await conn.model("users").find({
      isActive: true,
      accessLevel: 2,
      name: {
        $regex: new RegExp(keyword, "i"),
      },
    });

    return users.map((x) => {
      return {
        name: x.name,
        _id: x._id.toString(),
      };
    });
  }
}

export default UserSalesModel;
