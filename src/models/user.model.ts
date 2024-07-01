import { FetchInterface } from "../interfaces/fetch.interface";
import { UserInterface } from "../interfaces/user.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class UserModelModel {
  _id?: string;
  name: string;
  password?: string;
  username: string;
  isActive: boolean;
  accessLevel: number;
  code: string;
  createdBy?: string | null;
  createdAt?: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
  constructor(data: UserInterface) {
    this._id = data._id;
    this.name = data.name;
    this.password = data.password;
    this.username = data.username;
    this.isActive = data.isActive;
    this.accessLevel = data.accessLevel;
    this.code = data.code;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.deletedBy = data.deletedBy;
    this.deletedAt = data.deletedAt;
  }

  create() {
    return conn.model("users").create({
      name: this.name,
      password: this.password,
      username: this.username,
      isActive: this.isActive,
      accessLevel: this.accessLevel,
      code: this.code,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      deletedBy: this.deletedBy,
      deletedAt: this.deletedAt,
    });
  }

  update() {
    return conn.model("users").findByIdAndUpdate(this._id, {
      name: this.name,
      password: this.password,
      username: this.username,
      isActive: this.isActive,
      accessLevel: this.accessLevel,
      code: this.code,
    });
  }

  static fetch(data: FetchInterface) {
    return Promise.all([
      conn
        .model("users")
        .find({
          $or: [
            { username: RegExp(data.keyword, "i") },
            { code: RegExp(data.keyword, "i") },
            { name: RegExp(data.keyword, "i") },
          ],
        })
        .limit(20)
        .skip((data.page - 1) * 20)
        .sort({ name: 1 }),
      conn.model("users").countDocuments({
        $or: [
          { username: RegExp(data.keyword, "i") },
          { code: RegExp(data.keyword, "i") },
          { name: RegExp(data.keyword, "i") },
        ],
      }),
    ]);
  }

  static async fetchByID(id: string): Promise<UserModelModel> {
    try {
      const result = await conn.model("users").findById(id);
      if (!result) throw new Error("User not found.");
      return new UserModelModel(result);
    } catch (error: unknown) {
      throw new Error(error?.toString() ?? "An unknown error occurred.");
    }
  }

  static async fetchByUsername(
    username: string
  ): Promise<UserModelModel | null> {
    try {
      const result = await conn.model("users").findOne({ username });
      return result ? new UserModelModel(result) : null;
    } catch (error: unknown) {
      throw new Error(error?.toString() ?? "An unknown error occurred.");
    }
  }

  static async fetchSync(): Promise<UserModelModel[]> {
    try {
      const result = await conn.model("users").find({
        isActive: true,
      });
      return result.map((data) => new UserModelModel(data));
    } catch (error: unknown) {
      throw new Error(error?.toString() ?? "An unknown error occurred.");
    }
  }

  static async fetchInitial(): Promise<UserModelModel[] | undefined> {
    return conn.model("users").find({ isActive: true });
  }

  static deleteByID(id: string, userID: string) {
    return conn.model("users").findByIdAndUpdate(id, {
      isActive: false,
      deletedBy: userID,
      deletedAt: new Date(),
    });
  }

  static async preCreate(username: string, code: string): Promise<boolean> {
    const count = await conn.model("users").countDocuments({
      $or: [{ username: username }, { code: code }],
    });

    return count == 0;
  }

  static async preUpdate(
    username: string,
    code: string,
    id: string
  ): Promise<boolean> {
    const count = await conn.model("users").countDocuments({
      $or: [{ username: username }, { code: code }],
      _id: { $ne: id },
    });

    return count == 0;
  }
}

export default UserModelModel;
