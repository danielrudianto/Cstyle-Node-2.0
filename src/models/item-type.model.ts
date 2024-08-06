import { ItemTypeInterface } from "../interfaces/item-type.interface";
import { FetchInterface } from "../interfaces/fetch.interface";
import MigrationModelModel from "./migration.model";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class ItemTypeModelModel {
  id?: string;
  name?: string;
  description?: string;
  createdBy?: string;
  createdAt?: Date;

  constructor(data: ItemTypeInterface) {
    this.name = data.name;
    this.description = data.description;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.id = data.id;
  }

  create() {
    return conn.model("itemtypes").create({
      name: this.name,
      description: this.description,
      createdBy: this.createdBy!,
      createdAt: new Date(),
    });
  }

  update() {
    return Promise.all([
      conn.model("itemtypes").updateOne(
        {
          _id: this.id,
        },
        {
          name: this.name,
        }
      ),
      MigrationModelModel.updateProductType({
        id: this.id!,
        name: this.name!,
      }),
    ]);
  }

  delete() {
    return conn.model("itemtypes").updateOne(
      {
        _id: this.id,
      },
      {
        isDelete: true,
        deletedAt: new Date(),
        deletedBy: this.createdBy,
      }
    );
  }

  static fetchV2(data: FetchInterface) {
    return Promise.all([
      conn
        .model("itemtypes")
        .find({
          isDelete: false,
          $or: [
            {
              name: {
                $regex: new RegExp(data.keyword, "i"),
              },
            },
            {
              description: {
                $regex: new RegExp(data.keyword, "i"),
              },
            },
          ],
        })
        .sort({
          name: 1,
        })
        .skip((data.page - 1) * 20)
        .limit(20)
        .populate("_id name createdBy createdAt isDelete deletedBy deletedAt"),
      conn.model("itemtypes").countDocuments({
        isDelete: false,
        $or: [
          {
            name: {
              $regex: new RegExp(data.keyword, "i"),
            },
          },
          {
            description: {
              $regex: new RegExp(data.keyword, "i"),
            },
          },
        ],
      }),
    ]);
  }

  static fetchByID(id: string) {
    return conn.model("itemtypes").findById(id);
  }

  static count() {
    return conn.model("itemtypes").countDocuments({
      isDelete: false,
    });
  }

  static async preCreate(data: ItemTypeInterface): Promise<boolean> {
    try {
      const count = await conn.model("itemtypes").countDocuments({
        name: data.name,
        is_delete: false,
      });
      return count == 0;
    } catch (error) {
      throw error;
    }
  }

  static async preUpdate(data: ItemTypeInterface): Promise<boolean> {
    try {
      const count = await conn.model("itemtypes").countDocuments({
        name: data.name,
        isDelete: false,
        _id: {
          $ne: data.id,
        },
      });

      const exists = await conn.model("itemtypes").findById(data.id);

      return count == 0 && exists != null;
    } catch (error) {
      throw error;
    }
  }

  static async preDelete(data: ItemTypeInterface): Promise<boolean> {
    try {
      const count = await conn.model("itemtypes").findById(data.id);

      return count == null ? false : count.isDelete ? false : true;
    } catch (error) {
      throw error;
    }
  }

  static fetch(data: FetchInterface) {
    return conn
      .model("itemtypes")
      .find(
        data.keyword == ""
          ? {
              isDelete: false,
            }
          : {
              isDelete: false,
              name: {
                $regex: new RegExp(data.keyword, "i"),
              },
            }
      )
      .sort({
        name: 1,
      })
      .skip((data.page - 1) * 20)
      .limit(20)
      .populate("_id name createdBy createdAt isDelete deletedBy deletedAt");
  }

  static fetchAutocomplete(keyword: string) {
    return conn
      .model("itemtypes")
      .find(
        keyword == ""
          ? {
              isDelete: false,
            }
          : {
              isDelete: false,
              name: {
                $regex: new RegExp(keyword, "i"),
              },
            },
        {
          limit: 5,
        }
      )
      .populate("_id name")
      .sort({ name: 1 });
  }
}

export default ItemTypeModelModel;
