import { FetchInterface } from "../interfaces/fetch.interface";
import { ItemBrandInterface } from "../interfaces/item-brand.interface";
import { connectionFactory } from "../utils/connector.utils";
import MigrationModelModel from "./migration.model";

const conn = connectionFactory();

class ItemBrandModelModel {
  id?: string;
  name?: string;
  createdBy?: string;
  createdAt?: Date;

  constructor(data: ItemBrandInterface) {
    this.name = data.name;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.id = data.id;
  }

  create() {
    return conn.model("itembrands").create({
      name: this.name,
      createdBy: this.createdBy!,
      createdAt: new Date(),
    });
  }

  update() {
    return Promise.all([
      conn.model("itembrands").updateOne(
        {
          _id: this.id,
        },
        {
          name: this.name,
        }
      ),
      MigrationModelModel.updateProductBrand({
        id: this.id!,
        name: this.name!,
      }),
    ]);
  }

  delete() {
    return conn.model("itembrands").updateOne(
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

  static fetchByID(id: string) {
    return conn.model("itembrands").findById(id);
  }

  static async preCreate(data: ItemBrandInterface): Promise<boolean> {
    try {
      const count = await conn.model("itembrands").countDocuments({
        name: data.name,
        is_delete: false,
      });
      return count == 0;
    } catch (error) {
      throw error;
    }
  }

  static async preUpdate(data: ItemBrandInterface): Promise<boolean> {
    try {
      const count = await conn.model("itembrands").findById(data.id);
      return count == null ? false : count.isDelete ? false : true;
    } catch (error) {
      throw error;
    }
  }

  static async preDelete(data: ItemBrandInterface): Promise<boolean> {
    try {
      const count = await conn.model("itembrands").findById(data.id);
      return count != null;
    } catch (error) {
      throw error;
    }
  }

  static fetch(data: FetchInterface) {
    return conn
      .model("itembrands")
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

  static fetchV2(data: FetchInterface) {
    return Promise.all([
      conn
        .model("itembrands")
        .find({
          isDelete: false,
          name: {
            $regex: new RegExp(data.keyword, "i"),
          },
        })
        .sort({
          name: 1,
        })
        .skip((data.page - 1) * 20)
        .limit(20)
        .populate("_id name createdBy createdAt isDelete deletedBy deletedAt"),
      conn.model("itembrands").countDocuments({
        isDelete: false,
        name: {
          $regex: new RegExp(data.keyword, "i"),
        },
      }),
    ]);
  }

  static fetchAutocomplete(keyword: string) {
    return conn
      .model("itembrands")
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

export default ItemBrandModelModel;
