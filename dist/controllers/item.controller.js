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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const error_list_1 = require("../data/error-list");
const logger_interface_1 = require("../interfaces/logger.interface");
const fs_1 = __importDefault(require("fs"));
const migration_model_1 = __importDefault(require("../models/migration.model"));
const item_model_1 = __importDefault(require("../models/item.model"));
const queue_utils_1 = require("../utils/queue.utils");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
const store_model_1 = __importDefault(require("../models/store.model"));
class ItemController {
}
_a = ItemController;
ItemController.createV2 = (req, res) => {
    const data = req.body;
    const item = JSON.parse(data.item);
    const reference = item.reference;
    const description = item.description;
    const itemTypeID = item.itemTypeID;
    const itemBrandID = item.itemBrandID;
    const price = item.price;
    const barcode = item.barcode;
    const createdBy = data.userID;
    const images = data.images;
    item_model_1.default.preCreate({
        reference: reference,
        description: description,
        isActive: true,
    }).then((validation) => {
        if (!validation) {
            if (images.length > 0) {
                for (const image of images) {
                    fs_1.default.unlinkSync(image);
                }
            }
            return res.status(400).send(error_list_1.ErrorList["ITEM_ALREADY_EXIST"]);
        }
        else {
            new item_model_1.default({
                reference: reference,
                description: description,
                itemTypeID: itemTypeID,
                itemBrandID: itemBrandID,
                createdBy: createdBy,
                price: price,
                barcode: barcode,
                isFavorite: false,
                images: images,
                isActive: true,
            })
                .create()
                .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                yield queue_utils_1.queue.add("createProduct", {
                    id: result._id,
                });
                if (images.length > 0) {
                    yield queue_utils_1.queue.add("createProductImage", {
                        id: result._id,
                    });
                }
                return res.status(200).send(result);
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on creating item ${error}`,
                    tag: "Item",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    });
};
ItemController.updateV2 = (req, res) => {
    const data = req.body;
    if ("item" in data) {
        const item = JSON.parse(data.item);
        const id = item.id;
        const reference = item.reference;
        const description = item.description;
        const itemTypeID = item.itemTypeID;
        const itemBrandID = item.itemBrandID;
        const price = item.price;
        const barcode = item.barcode;
        const isActive = item.isActive;
        const newImages = req.body.images;
        item_model_1.default.preUpdate({
            reference: reference,
            id: id,
            isActive: isActive,
        })
            .then((validation) => __awaiter(void 0, void 0, void 0, function* () {
            if (!validation) {
                return res.status(404).send(error_list_1.ErrorList["ITEM_NOT_FOUND"]);
            }
            else {
                const product = yield item_model_1.default.fetchByID(id);
                if (!product) {
                    return res.status(404).send(error_list_1.ErrorList["ITEM_NOT_FOUND"]);
                }
                new item_model_1.default({
                    id: id,
                    reference: reference,
                    description: description,
                    itemTypeID: itemTypeID,
                    itemBrandID: itemBrandID,
                    price: price,
                    barcode: barcode,
                    images: [...product.images, ...newImages],
                    isActive: isActive,
                })
                    .update()
                    .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                    yield queue_utils_1.queue.add("updateProduct", {
                        id: id,
                    });
                    if (newImages.length > 0) {
                        yield queue_utils_1.queue.add("updateProductImage", {
                            id: id,
                            images: newImages,
                        });
                    }
                    return res.status(201).send(result);
                }))
                    .catch((error) => {
                    new logger_utils_1.default({
                        type: logger_interface_1.LoggerType.error,
                        message: `Error on updating item ${error}`,
                        tag: "Item",
                    }).log();
                });
            }
        }))
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on pre-creating item ${error}`,
                tag: "Item",
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    }
    else {
        return res.status(400).send(error_list_1.ErrorList["BAD_REQUEST"]);
    }
};
ItemController.updateFavoriteStatus = (req, res) => {
    const isFavorite = req.body.isFavorite;
    const itemID = req.body.itemID;
    item_model_1.default.updateFavoriteStatus({
        id: itemID,
        isFavorite: isFavorite,
    })
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on updating item favorite status ${error}`,
            tag: "Item",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemController.updatePrice = (req, res) => {
    const items = req.body.items;
    item_model_1.default.updatePrice(items)
        .then((result) => {
        return res.status(201).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on updating price ${error}`,
            tag: "Item",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemController.deleteByID = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    item_model_1.default.preDelete(id).then((validation) => {
        if (!validation) {
            return res.status(404).send(error_list_1.ErrorList["ITEM_NOT_FOUND"]);
        }
        else {
            item_model_1.default.delete({
                id: id,
                userID: userID,
            })
                .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                if (result == null) {
                    return res.status(404).send(error_list_1.ErrorList["ITEM_NOT_FOUND"]);
                }
                else {
                    const images = result.images;
                    for (const image of images) {
                        fs_1.default.unlinkSync(image);
                    }
                    yield queue_utils_1.queue.add("deleteProduct", {
                        id: id,
                    });
                    return res.status(200).send(result);
                }
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on deleting item ${error}`,
                    tag: "Item",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    });
};
ItemController.deleteImage = (req, res) => {
    const fileName = req.params.name;
    const itemID = req.params.id;
    if (fs_1.default.existsSync(`upload/${fileName}`)) {
        fs_1.default.unlinkSync(`upload/${fileName}`);
        Promise.all([
            item_model_1.default.deleteImage(`upload/${fileName}`, itemID),
            migration_model_1.default.deleteProductImage(`upload/${fileName}`, itemID),
        ])
            .then(([result, _]) => {
            return res.status(200).send(result);
        })
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on deleting item image ${error}`,
                tag: "Item",
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    }
    else {
        return res.status(404).send(error_list_1.ErrorList["ITEM_NOT_FOUND"]);
    }
};
ItemController.fetchV2 = (req, res) => {
    const page = !req.query.page ? 1 : parseInt(req.query.page);
    const keyword = !req.query.keyword ? "" : req.query.keyword;
    item_model_1.default.fetch({
        keyword: keyword,
        page: page,
        onlyActive: false,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching item ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Item",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemController.downloadV2 = (req, res) => {
    const storeID = req.body.storeID;
    Promise.all([
        item_model_1.default.fetchInitial(),
        stock_model_1.default.fetchInitial(),
        store_model_1.default.fetchOthers(null),
    ])
        .then(([items, stocks, stores]) => {
        const itemResult = [];
        for (let i = 0; i < items.length; i++) {
            const availableStocks = stocks.filter((x) => x.itemID.toString() == items[i]._id);
            itemResult.push({
                id: items[i]._id,
                reference: items[i].reference,
                description: items[i].description,
                brand: items[i].itemBrandID.name,
                type: items[i].itemTypeID.name,
                stock: availableStocks.map((x) => {
                    return {
                        quantity: x.quantity,
                        storeID: x.storeID,
                    };
                }),
            });
        }
        return res.status(200).send({
            store: stores,
            data: itemResult,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching item stock ${error}`,
            tag: "Item",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemController.download = (req, res) => {
    item_model_1.default.download()
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on downloading item ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Item",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemController.fetchByBranchV2 = (req, res) => {
    const page = req.body.page;
    const keyword = req.body.keyword;
    const branch = req.body.branch;
    const onlyActive = !req.body.onlyActive ? false : req.body.onlyActive;
    item_model_1.default.fetchV2WStock({
        keyword: keyword,
        page: page,
        branch: branch,
        onlyActive: onlyActive,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching item ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Item",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemController.fetchPrice = (req, res) => {
    const type = req.body.type;
    const brand = req.body.brand;
    item_model_1.default.fetchPrices({
        brand: brand,
        type: type,
    })
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching item price ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Item",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemController.fetchByID = (req, res) => {
    const id = req.params.id;
    item_model_1.default.fetchByID(id)
        .then((x) => {
        if (!x) {
            return res.status(404).send(error_list_1.ErrorList["ITEM_NOT_FOUND"]);
        }
        else {
            return res.status(200).send({
                _id: id,
                reference: x.reference,
                description: x.description,
                createdAt: x.createdAt,
                createdBy: x.createdBy,
                images: x.images.map((z) => {
                    return `${process.env.BASE_URL}/${z}`;
                }),
                brandID: x.itemBrandID._id,
                typeID: x.itemTypeID._id,
                itemBrand: {
                    name: x.itemBrandID.name,
                    _id: x.itemBrandID._id,
                },
                itemType: {
                    name: x.itemTypeID.name,
                    description: x.itemTypeID.description,
                    _id: x.itemTypeID._id,
                },
                price: x.price,
                barcode: x.barcode,
                isActive: x.isActive,
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching item ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Item",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = ItemController;
//# sourceMappingURL=item.controller.js.map