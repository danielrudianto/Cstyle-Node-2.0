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
const adjustment_model_1 = __importDefault(require("../models/adjustment.model"));
const queue_utils_1 = require("../utils/queue.utils");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const stock_model_1 = __importDefault(require("../models/stock.model"));
const lock_utils_1 = __importDefault(require("../utils/lock.utils"));
class AdjustmentEventController {
}
_a = AdjustmentEventController;
AdjustmentEventController.create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const date = req.body.date;
    const items = req.body.items;
    const userID = req.body.userID;
    const store = req.body.store;
    if (items.filter((x) => x.quantity == 0).length > 0) {
        return res.status(400).send(error_list_1.ErrorList["BAD_REQUEST"]);
    }
    else {
        const negativeItems = items.filter((x) => x.quantity < 0);
        lock_utils_1.default
            .acquire(items.map((x) => {
            return `${x.id}:${store == null ? "" : store}`;
        }), () => __awaiter(void 0, void 0, void 0, function* () {
            const validation = yield adjustment_model_1.default.preCreate(negativeItems, store);
            if (!validation) {
                return res.status(400).send(error_list_1.ErrorList["INSUFFICIENT_STOCK"]);
            }
            else {
                try {
                    const name = yield adjustment_model_1.default.generateName(new Date(date));
                    const result = yield new adjustment_model_1.default({
                        date: new Date(date),
                        name: name,
                        storeID: store,
                        items: items.map((x) => {
                            return {
                                itemID: x.id,
                                quantity: x.quantity,
                            };
                        }),
                        createdBy: userID,
                    }).create();
                    items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                        yield new stock_model_1.default({
                            itemID: x.id,
                            quantity: x.quantity,
                            storeID: store,
                        }).update();
                        if (x.quantity < 0) {
                            const stockOutData = {
                                itemID: x.id,
                                quantity: Math.abs(x.quantity),
                                adjustmentEventID: result._id,
                                storeID: store,
                                date: date,
                                billID: null,
                                invoiceID: null,
                            };
                            yield queue_utils_1.queue.add("insertStockOut", stockOutData);
                        }
                        else if (x.quantity > 0) {
                            const stockInData = {
                                itemID: x.id,
                                quantity: x.quantity,
                                residue: x.quantity,
                                price: 0,
                                adjustmentEventID: result._id,
                                goodReceiptID: null,
                                storeID: store,
                                date: date,
                            };
                            yield queue_utils_1.queue.add("insertStockIn", stockInData);
                        }
                    }));
                    return result;
                }
                catch (error) {
                    new logger_utils_1.default({
                        message: `Error on creating adjustment event: ${error}`,
                        type: logger_interface_1.LoggerType.error,
                        tag: "Adjustment",
                    }).log();
                    return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
                }
            }
        }))
            .then((value) => {
            return res.status(201).send(value);
        })
            .catch((error) => {
            new logger_utils_1.default({
                message: `Error on creating adjustment event: ${error}`,
                type: logger_interface_1.LoggerType.error,
                tag: "Adjustment",
            }).log();
            return res.status(500).send(error);
        });
    }
});
AdjustmentEventController.fetch = (req, res) => {
    const page = req.body.page;
    const month = req.body.month;
    const year = req.body.year;
    const keyword = req.body.keyword;
    const status = req.body.status;
    adjustment_model_1.default.fetch({
        page: page,
        month: month + 1,
        year: year,
        keyword: keyword,
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
            message: `Error on fetching adjustment event: ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Adjustment",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
AdjustmentEventController.fetchByID = (req, res) => {
    const id = req.params.id;
    adjustment_model_1.default.fetchByID(id)
        .then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["ADJUSTMENT_EVENT_NOT_FOUND"]);
        }
        else {
            return res.status(200).send(result);
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching adjustment event: ${error}`,
            tag: "Adjustment",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
AdjustmentEventController.deleteByID = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    adjustment_model_1.default.fetchByID(id)
        .then((adjustmentEvent) => __awaiter(void 0, void 0, void 0, function* () {
        if (!adjustmentEvent || adjustmentEvent.isDelete) {
            return res.status(404).send(error_list_1.ErrorList["ADJUSTMENT_EVENT_NOT_FOUND"]);
        }
        yield lock_utils_1.default.acquire(adjustmentEvent.items
            .filter((x) => x.quantity > 0)
            .map((x) => {
            return `${x.itemID._id.toString()}:${adjustmentEvent.storeID == null
                ? ""
                : adjustmentEvent.storeID._id.toString()}`;
        }), (done) => {
            stock_model_1.default.checkStockByItemIDs(adjustmentEvent.items
                .filter((x) => x.quantity > 0)
                .map((x) => {
                return {
                    itemID: x.itemID._id,
                    quantity: x.quantity,
                };
            }), adjustmentEvent.storeID == null
                ? null
                : adjustmentEvent.storeID._id)
                .then((stocks) => __awaiter(void 0, void 0, void 0, function* () {
                let validation = true;
                adjustmentEvent.items
                    .filter((x) => x.quantity > 0)
                    .forEach((x) => {
                    const stockIndex = stocks.findIndex((y) => y.itemID.toString() == x.itemID._id.toString());
                    if (stockIndex == -1) {
                        validation = false;
                    }
                    else {
                        const stock = stocks[stockIndex].quantity;
                        if (stock < x.quantity) {
                            validation = false;
                        }
                    }
                });
                if (!validation) {
                    done();
                    return res.status(400).send(error_list_1.ErrorList["INSUFFICIENT_STOCK"]);
                }
                else {
                    adjustment_model_1.default.deleteByID(id, userID).then((result) => __awaiter(void 0, void 0, void 0, function* () {
                        result.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                            yield new stock_model_1.default({
                                itemID: x.itemID._id,
                                storeID: adjustmentEvent.storeID == null
                                    ? null
                                    : adjustmentEvent.storeID._id,
                                quantity: x.quantity * -1,
                            }).update();
                        }));
                        yield queue_utils_1.queue.add("deleteAdjustment", {
                            id: id,
                        });
                        done();
                        return res.status(200).send(result);
                    }));
                }
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on checking stock for adjustment event: ${error}`,
                    tag: "Adjustment",
                    type: logger_interface_1.LoggerType.error,
                }).log();
                done();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        });
    }))
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching adjustment event: ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Adjustment",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = AdjustmentEventController;
//# sourceMappingURL=adjustment-event.controller.js.map