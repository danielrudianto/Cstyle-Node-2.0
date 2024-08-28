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
const good_receipt_model_1 = require("../models/good-receipt.model");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const error_list_1 = require("../data/error-list");
const queue_utils_1 = require("../utils/queue.utils");
const stock_model_1 = __importDefault(require("../models/stock.model"));
const lock_utils_1 = __importDefault(require("../utils/lock.utils"));
class GoodReceiptController {
}
_a = GoodReceiptController;
GoodReceiptController.create = (req, res) => {
    const name = req.body.name;
    const date = req.body.date;
    const supplier = req.body.supplier;
    const items = req.body.items;
    const userID = req.body.userID;
    new good_receipt_model_1.GoodReceiptCreateModel({
        name: name,
        date: date,
        supplierID: supplier,
        createdBy: userID,
        items: items.map((x) => {
            return {
                itemID: x.id,
                quantity: x.quantity,
                price: x.price,
                discount: (x.price * x.discount) / 100,
            };
        }),
    })
        .create()
        .then((result) => __awaiter(void 0, void 0, void 0, function* () {
        yield lock_utils_1.default.acquire(items.map((x) => {
            return `${x.id}:`;
        }), (done) => __awaiter(void 0, void 0, void 0, function* () {
            items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                yield new stock_model_1.default({
                    itemID: x.id,
                    quantity: x.quantity,
                    storeID: null,
                }).update();
                const stockInData = {
                    itemID: x.id,
                    quantity: x.quantity,
                    residue: x.quantity,
                    price: (x.price * (100 - x.discount)) / 100,
                    adjustmentEventID: null,
                    goodReceiptID: result._id,
                    storeID: null,
                    date: date,
                };
                yield queue_utils_1.queue.add("insertStockIn", stockInData);
            }));
            done();
            return res.status(201).send(result);
        }));
    }))
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on creating good receipt ${error}`,
            tag: "GoodReceipt",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
GoodReceiptController.fetch = (req, res) => {
    const keyword = req.body.keyword;
    const month = req.body.month + 1;
    const year = req.body.year;
    const page = req.body.page;
    const status = req.body.status;
    good_receipt_model_1.GoodReceiptModelModel.fetch({
        keyword: keyword,
        month: month,
        year: year,
        page: page,
        status: status,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching good receipt ${error}`,
            tag: "GoodReceipt",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
GoodReceiptController.fetchByID = (req, res) => {
    const id = req.params.id;
    good_receipt_model_1.GoodReceiptModelModel.fetchByID(id)
        .then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["GOOD_RECEIPT_NOT_FOUND"]);
        }
        else {
            return res.status(200).send(result);
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching good receipt ${error}`,
            tag: "Good receipt",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
GoodReceiptController.updateByID = (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const supplierID = req.body.supplier;
    const newItems = req.body.items;
    const date = req.body.date;
    const userID = req.body.userID;
    good_receipt_model_1.GoodReceiptModelModel.fetchByID(id).then((result) => __awaiter(void 0, void 0, void 0, function* () {
        if (!result || result.isDelete) {
            return res.status(404).send(error_list_1.ErrorList["GOOD_RECEIPT_ALREADY_DELETED"]);
        }
        const items = result.items;
        const stocks = yield stock_model_1.default.checkStockByItemIDs(items.map((x) => {
            return {
                itemID: x.itemID,
                quantity: x.quantity,
            };
        }), null);
        let validation = true;
        for (let i = 0; i < items.length; i++) {
            const stockIndex = stocks.findIndex((x) => x.itemID.toString() == items[i].itemID._id.toString());
            if (stockIndex == -1) {
                validation = false;
            }
            else {
                const newIndex = newItems.findIndex((x) => x.itemID == items[i].itemID._id.toString());
                if (newIndex != -1) {
                    if (stocks[stockIndex].quantity <
                        items[i].quantity - newItems[newIndex].quantity) {
                        validation = false;
                    }
                }
                else {
                    if (stocks[stockIndex].quantity < items[i].quantity) {
                        validation = false;
                    }
                }
            }
        }
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["INSUFFICIENT_STOCK"]);
        }
        else {
            new good_receipt_model_1.GoodReceiptCreateModel({
                id: id,
                name: name,
                supplierID: supplierID,
                date: date,
                items: newItems.map((x) => {
                    return {
                        itemID: x.itemID,
                        quantity: x.quantity,
                        price: x.price,
                        discount: (x.price * x.discount) / 100,
                    };
                }),
                createdBy: userID,
            })
                .update()
                .then((goodReceipt) => __awaiter(void 0, void 0, void 0, function* () {
                const newItemIDs = newItems.map((x) => x.itemID);
                const itemIDs = result.items.map((x) => x.itemID._id.toString());
                const newIDs = newItemIDs.concat(itemIDs);
                const uniqueIDs = new Set(newIDs);
                const uniqueArray = Array.from(uniqueIDs);
                yield lock_utils_1.default.acquire(uniqueArray.map((x) => {
                    return `${x}:`;
                }), (done) => __awaiter(void 0, void 0, void 0, function* () {
                    for (let i = 0; i < result.items.length; i++) {
                        const data = {
                            itemID: result.items[i].itemID,
                            quantity: result.items[i].quantity,
                            goodReceiptID: id,
                            adjustmentCaseID: null,
                            storeID: null,
                        };
                        yield queue_utils_1.queue.add("removeStockIn", data);
                        yield new stock_model_1.default({
                            quantity: result.items[i].quantity * -1,
                            itemID: result.items[i].itemID,
                            storeID: null,
                        }).update();
                    }
                    for (let i = 0; i < newItems.length; i++) {
                        const data = {
                            goodReceiptID: id,
                            itemID: newItems[i].itemID,
                            quantity: newItems[i].quantity,
                            price: (newItems[i].price * (100 - newItems[i].discount)) / 100,
                            residue: newItems[i].quantity,
                            adjustmentEventID: null,
                            storeID: null,
                            date: new Date(date),
                        };
                        yield queue_utils_1.queue.add("insertStockIn", data);
                        yield new stock_model_1.default({
                            quantity: newItems[i].quantity,
                            itemID: newItems[i].itemID,
                            storeID: null,
                        }).update();
                    }
                    done();
                    return res.status(201).send(goodReceipt);
                }));
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on updating good receipt document ${error}`,
                    tag: "Good receipt",
                    type: logger_interface_1.LoggerType.error,
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    }));
};
GoodReceiptController.deleteByID = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    good_receipt_model_1.GoodReceiptModelModel.fetchByID(id)
        .then((goodReceipt) => __awaiter(void 0, void 0, void 0, function* () {
        if (!goodReceipt) {
            return res.status(404).send(error_list_1.ErrorList["GOOD_RECEIPT_NOT_FOUND"]);
        }
        if (goodReceipt.isDelete) {
            return res
                .status(404)
                .send(error_list_1.ErrorList["GOOD_RECEIPT_ALREADY_DELETED"]);
        }
        yield lock_utils_1.default.acquire(goodReceipt.items.map((x) => {
            return `${x.itemID._id.toString()}:`;
        }), (done) => {
            stock_model_1.default.checkStockByItemIDs(goodReceipt.items.map((x) => {
                return x.itemID._id;
            }), null).then((stocks) => {
                let validation = true;
                for (let i = 0; i < goodReceipt.items.length; i++) {
                    const stockIndex = stocks.findIndex((x) => x.itemID.toString() ==
                        goodReceipt.items[i].itemID._id.toString());
                    if (stockIndex == -1) {
                        validation = false;
                    }
                    else {
                        if (stocks[stockIndex].quantity < goodReceipt.items[i].quantity) {
                            validation = false;
                        }
                    }
                }
                if (!validation) {
                    done();
                    return res.status(400).send(error_list_1.ErrorList["INSUFFICIENT_STOCK"]);
                }
                good_receipt_model_1.GoodReceiptModelModel.deleteByID(id, userID)
                    .then((result) => {
                    if (result) {
                        goodReceipt.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                            yield new stock_model_1.default({
                                quantity: x.quantity * -1,
                                itemID: x.itemID,
                                storeID: null,
                            }).update();
                            const data = {
                                itemID: x.itemID,
                                quantity: x.quantity,
                                goodReceiptID: id,
                                adjustmentCaseID: null,
                                storeID: null,
                            };
                            yield queue_utils_1.queue.add("removeStockIn", data);
                            done();
                            return res.status(200).send(result);
                        }));
                    }
                    else {
                        return res
                            .status(404)
                            .send(error_list_1.ErrorList["GOOD_RECEIPT_NOT_FOUND"]);
                    }
                })
                    .catch((error) => {
                    done();
                    new logger_utils_1.default({
                        message: `Error on deleting good receipt ${error}`,
                        tag: "Good receipt",
                        type: logger_interface_1.LoggerType.error,
                    }).log();
                    return res
                        .status(500)
                        .send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
                });
            });
        });
    }))
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching good receipt ${error}`,
            tag: "Good receipt",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = GoodReceiptController;
//# sourceMappingURL=good-receipt.controller.js.map