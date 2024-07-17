import {
  ItemDeleteInterface,
  ItemFetchInterface,
  ItemFetchInterfaceBranch,
  ItemInterface,
  ItemPriceFetchInterface,
  ItemUpdateFavorite,
  ItemUpdatePriceInterface,
} from "../interfaces/item.interface";
import { Types } from "mongoose";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class ItemModelModel {
  id?: string;
  reference?: string;
  description?: string;
  itemTypeID?: string;
  itemBrandID?: string;
  createdBy?: string;
  price?: number;
  barcode?: string | null;
  isFavorite?: boolean;
  images?: string[];
  isActive: boolean;

  constructor(data: ItemInterface) {
    this.id = data.id;
    this.reference = data.reference;
    this.description = data.description;
    this.itemTypeID = data.itemTypeID;
    this.itemBrandID = data.itemBrandID;
    this.createdBy = data.createdBy;
    this.price = data.price;
    this.barcode = data.barcode;
    this.isFavorite = data.isFavorite;
    this.images = data.images;
    this.isActive = data.isActive;
  }

  create() {
    return conn.model("items").create({
      reference: this.reference,
      description: this.description,
      barcode: this.barcode,
      itemTypeID: this.itemTypeID,
      itemBrandID: this.itemBrandID,
      createdBy: this.createdBy,
      price: this.price,
      isFavorite: this.isFavorite,
      createdAt: new Date(),
      images: this.images,
    });
  }

  static fetch(data: ItemFetchInterface) {
    return Promise.all([
      conn
        .model("items")
        .find({
          isDelete: false,
          $or: [
            {
              reference: {
                $regex: RegExp(data.keyword, "i"),
              },
            },
            {
              description: {
                $regex: RegExp(data.keyword, "i"),
              },
            },
          ],
        })
        .skip((data.page - 1) * 20)
        .limit(20)
        .populate({
          path: "itemBrandID",
          select: "name",
        })
        .populate("_id reference description createdAt images price")
        .populate({
          path: "itemTypeID",
          select: "name description",
        })
        .sort({
          reference: 1,
        }),
      conn.model("items").countDocuments({
        isDelete: false,
        $or: [
          {
            reference: {
              $regex: RegExp(data.keyword, "i"),
            },
          },
          {
            description: {
              $regex: RegExp(data.keyword, "i"),
            },
          },
        ],
      }),
    ]);
  }

  static fetchPrices(data: ItemPriceFetchInterface) {
    const filters = [];
    if (data.brand.length > 0) {
      filters.push({
        itemBrandID: {
          $in: data.brand,
        },
      });
    }

    if (data.type.length > 0) {
      filters.push({
        itemTypeID: {
          $in: data.type,
        },
      });
    }

    return conn
      .model("items")
      .find({
        $and: [...filters],
        isDelete: false,
      })
      .select("_id reference description price")
      .populate("itemTypeID", "name")
      .populate("itemBrandID", "name");
  }

  static fetchPopular() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 30 * 270);

    return Promise.all([
      conn.model("packing-lists").aggregate([
        {
          $match: {
            date: {
              $gte: new Date(currentDate),
            },
            isDelete: false,
          },
        },
        {
          $unwind: {
            path: "$items",
          },
        },
        {
          $group: {
            _id: "$items.itemID",
            quantity: {
              $sum: "$items.quantity",
            },
          },
        },
        {
          $sort: {
            quantity: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "items",
            localField: "_id",
            foreignField: "_id",
            as: "item",
          },
        },
        {
          $unwind: {
            path: "$item",
          },
        },
        {
          $project: {
            reference: "$item.reference",
            description: "$item.description",
            quantity: "$quantity",
          },
        },
      ]),
      conn.model("bills").aggregate([
        {
          $match: {
            date: {
              $gte: new Date(currentDate),
            },
            isDelete: false,
          },
        },
        {
          $unwind: {
            path: "$items",
          },
        },
        {
          $group: {
            _id: "$items.itemID",
            quantity: {
              $sum: "$items.quantity",
            },
          },
        },
        {
          $sort: {
            quantity: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "items",
            localField: "_id",
            foreignField: "_id",
            as: "item",
          },
        },
        {
          $unwind: {
            path: "$item",
          },
        },
        {
          $project: {
            reference: "$item.reference",
            description: "$item.description",
            quantity: "$quantity",
          },
        },
      ]),
    ]);
  }

  static async fetchV2WStock(data: ItemFetchInterfaceBranch) {
    const [items, countItems] = await Promise.all([
      conn
        .model("items")
        .find(
          data.onlyActive
            ? {
                isDelete: false,
                isActive: true,
                $or: [
                  {
                    reference: { $regex: RegExp(data.keyword, "i") },
                  },
                  {
                    description: { $regex: RegExp(data.keyword, "i") },
                  },
                ],
              }
            : {
                isDelete: false,
                $or: [
                  {
                    reference: { $regex: RegExp(data.keyword, "i") },
                  },
                  {
                    description: { $regex: RegExp(data.keyword, "i") },
                  },
                ],
              }
        )
        .populate("itemBrandID", "name")
        .populate("itemTypeID", "name")
        .limit(20)
        .skip((data.page - 1) * 20)
        .sort({ reference: 1 }),
      conn.model("items").countDocuments(
        data.onlyActive
          ? {
              isDelete: false,
              isActive: true,
              $or: [
                {
                  reference: { $regex: RegExp(data.keyword, "i") },
                },
                {
                  description: { $regex: RegExp(data.keyword, "i") },
                },
              ],
            }
          : {
              isDelete: false,
              $or: [
                {
                  reference: { $regex: RegExp(data.keyword, "i") },
                },
                {
                  description: { $regex: RegExp(data.keyword, "i") },
                },
              ],
            }
      ),
    ]);

    const itemIDs = items.map((item) => item._id);
    const stocks = await conn.model("stocks").find({
      itemID: { $in: itemIDs },
      storeID: data.branch,
    });

    return [
      items.map((x) => {
        const stockIndex = stocks.findIndex(
          (stock) => stock.itemID.toString() === x._id.toString()
        );

        return {
          item: {
            _id: x._id,
            reference: x.reference,
            description: x.description,
            createdAt: x.createdAt,
            price: x.price,
            brand: x.itemBrandID.name,
            type: x.itemTypeID.name,
          },
          quantity: stockIndex === -1 ? 0 : stocks[stockIndex].quantity,
        };
      }),
      countItems,
    ];
  }

  static updatePrice(data: ItemUpdatePriceInterface[]) {
    return conn.model("items").bulkWrite(
      data.map((x) => ({
        updateOne: {
          filter: {
            _id: x.id,
          },
          update: {
            $set: {
              price: x.price,
            },
          },
        },
      }))
    );
  }

  static updateFavoriteStatus(data: ItemUpdateFavorite) {
    return conn.model("items").updateOne(
      {
        _id: data.id,
      },
      {
        isFavorite: data.isFavorite,
      }
    );
  }
  update() {
    return conn.model("items").updateOne(
      {
        _id: this.id!,
      },
      {
        reference: this.reference,
        description: this.description,
        barcode: this.barcode,
        itemTypeID: this.itemTypeID,
        itemBrandID: this.itemBrandID,
        price: this.price,
        images: this.images,
        isActive: this.isActive,
      }
    );
  }

  static async deleteImage(imageURL: string, itemID: string) {
    const item = await conn.model("items").findById(itemID);
    if (!item) {
      throw new Error("Item not found");
    } else {
      item.images = item.images?.filter((x: string) => x != imageURL);
      return item.save();
    }
  }

  static delete(data: ItemDeleteInterface) {
    return conn.model("items").findByIdAndUpdate(data.id, {
      isDelete: true,
      deletedAt: new Date(),
      deletedBy: data.userID,
    });
  }

  static fetchByID(id: string) {
    return conn
      .model("items")
      .findById(new Types.ObjectId(id))
      .populate("itemTypeID")
      .populate("itemBrandID");
  }

  static fetchInitial(): Promise<any[]> {
    return conn
      .model("items")
      .find({
        isDelete: false,
      })
      .populate("itemTypeID")
      .populate("itemBrandID");
  }

  static async preCreate(data: ItemInterface) {
    // Check if item already exists
    try {
      const count = await conn.model("items").countDocuments({
        reference: data.reference,
        isDelete: false,
      });

      return count == 0;
    } catch (error) {
      throw error;
    }
  }

  static async preUpdate(data: ItemInterface) {
    try {
      const count = await conn.model("items").countDocuments({
        reference: data.reference,
        _id: {
          $ne: data.id,
        },
      });

      return count == 0;
    } catch (error) {
      throw error;
    }
  }

  static async preDelete(id: string) {
    try {
      const count = await conn.model("items").countDocuments({
        itemID: id,
        isDelete: false,
      });
      return count == 0;
    } catch (error) {
      throw error;
    }
  }
}

export default ItemModelModel;
