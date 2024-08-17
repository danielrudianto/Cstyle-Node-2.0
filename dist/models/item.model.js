"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class ItemModelModel {
    constructor(data) {
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
    static fetch(data) {
        return Promise.all([
            data.onlyActive
                ? conn
                    .model("items")
                    .find({
                    isDelete: false,
                    isActive: true,
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
                    .select("_id reference description createdAt images price")
                    .populate({
                    path: "itemTypeID",
                    select: "name description",
                })
                    .sort({
                    reference: 1,
                })
                : conn
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
            data.onlyActive
                ? conn.model("items").countDocuments({
                    isDelete: false,
                    isActive: true,
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
                : conn.model("items").countDocuments({
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
    static count() {
        return conn.model("items").countDocuments({
            isDelete: false,
        });
    }
    static fetchPrices(data) {
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
    static fetchV2WStock(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [items, countItems] = yield Promise.all([
                conn
                    .model("items")
                    .find(data.onlyActive
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
                    })
                    .populate("itemBrandID", "name")
                    .populate("itemTypeID", "name")
                    .limit(20)
                    .skip((data.page - 1) * 20)
                    .sort({ reference: 1 }),
                conn.model("items").countDocuments(data.onlyActive
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
                    }),
            ]);
            const itemIDs = items.map((item) => item._id);
            const stocks = yield conn.model("stocks").find({
                itemID: { $in: itemIDs },
                storeID: data.branch,
            });
            return [
                items.map((x) => {
                    const stockIndex = stocks.findIndex((stock) => stock.itemID.toString() === x._id.toString());
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
        });
    }
    static updatePrice(data) {
        return conn.model("items").bulkWrite(data.map((x) => ({
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
        })));
    }
    static updateFavoriteStatus(data) {
        return conn.model("items").updateOne({
            _id: data.id,
        }, {
            isFavorite: data.isFavorite,
        });
    }
    update() {
        return conn.model("items").updateOne({
            _id: this.id,
        }, {
            reference: this.reference,
            description: this.description,
            barcode: this.barcode,
            itemTypeID: this.itemTypeID,
            itemBrandID: this.itemBrandID,
            price: this.price,
            images: this.images,
            isActive: this.isActive,
        });
    }
    static deleteImage(imageURL, itemID) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const item = yield conn.model("items").findById(itemID);
            if (!item) {
                throw new Error("Item not found");
            }
            else {
                item.images = (_a = item.images) === null || _a === void 0 ? void 0 : _a.filter((x) => x != imageURL);
                return item.save();
            }
        });
    }
    static delete(data) {
        return conn.model("items").findByIdAndUpdate(data.id, {
            isDelete: true,
            deletedAt: new Date(),
            deletedBy: data.userID,
        });
    }
    static fetchByID(id) {
        return conn
            .model("items")
            .findById(new mongoose_1.Types.ObjectId(id))
            .populate("itemTypeID")
            .populate("itemBrandID");
    }
    static fetchInitial() {
        return conn
            .model("items")
            .find({
            isDelete: false,
        })
            .populate("itemTypeID")
            .populate("itemBrandID");
    }
    static preCreate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield conn.model("items").countDocuments({
                    reference: data.reference,
                    isDelete: false,
                });
                return count == 0;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static preUpdate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield conn.model("items").countDocuments({
                    reference: data.reference,
                    _id: {
                        $ne: data.id,
                    },
                });
                return count == 0;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static preDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield conn.model("items").countDocuments({
                    itemID: id,
                    isDelete: false,
                });
                return count == 0;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.default = ItemModelModel;
//# sourceMappingURL=item.model.js.map