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
const stock_request_model_1 = __importDefault(require("../models/stock-request.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const stock_model_1 = __importDefault(require("../models/stock.model"));
const lock_utils_1 = __importDefault(require("../utils/lock.utils"));
class StockRequestController {
}
_a = StockRequestController;
StockRequestController.create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestFrom = req.body.storeID == undefined ? null : req.body.storeID;
    const requestTo = req.body.requestTo;
    const items = req.body.item;
    const note = req.body.note;
    const userID = req.body.userID;
    const date = new Date(req.body.date);
    if (requestFrom == requestTo) {
        return res.status(400).send(error_list_1.ErrorList["STOCK_REQUEST_SAME_STORE"]);
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const count = yield stock_request_model_1.default.preCreate({
        month: month,
        year: year,
    });
    const name = "SR-CS-" +
        new Date().getFullYear() +
        "-" +
        (new Date().getMonth() + 1).toString().padStart(2, "0") +
        "-" +
        (count + 1).toString().padStart(4, "0");
    new stock_request_model_1.default({
        name: name,
        date: date,
        requestFrom: requestFrom,
        requestTo: requestTo,
        items: items.map((x) => {
            return {
                itemID: x.id,
                quantity: x.quantity,
            };
        }),
        note: note,
        createdBy: userID,
    })
        .create()
        .then((result) => {
        return res.status(201).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on creating stock request: ${error.message}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Stock request",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
});
StockRequestController.searchV2 = (req, res) => {
    const page = req.body.page;
    const keyword = req.body.keyword;
    const status = req.body.status;
    const month = req.body.month;
    const year = req.body.year;
    stock_request_model_1.default.fetch({
        page: page,
        keyword: keyword,
        status: status,
        month: month + 1,
        year: year,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching stock transfer requests ${error}`,
            tag: "Stock transfer request",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StockRequestController.fetchCreatedRequests = (req, res) => {
    const storeID = req.body.storeID;
    const page = req.body.page;
    stock_request_model_1.default.fetchCreated(page, storeID)
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching created request ${error}`,
            tag: "Stock request",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StockRequestController.fetchByID = (req, res) => {
    const id = req.params.id;
    stock_request_model_1.default.fetchByID(id)
        .then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["STOCK_REQUEST_NOT_FOUND"]);
        }
        else {
            return res.status(200).send(result);
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching stock transfer request ${error}`,
            tag: "Stock transfer request",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StockRequestController.reject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.body.id;
    const rejectNote = req.body.reason;
    const userID = req.body.userID;
    stock_request_model_1.default.rejectByID(id, userID, rejectNote)
        .then((result) => __awaiter(void 0, void 0, void 0, function* () {
        yield lock_utils_1.default.acquire(result.items.map((x) => {
            return x.itemID;
        }), (done) => {
            result.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                const data = {
                    itemID: x.itemID,
                    quantity: x.quantity,
                    storeID: result.requestTo,
                };
                yield new stock_model_1.default(data).update();
            }));
            done();
            return res.status(201).send(result);
        });
    }))
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on rejecting stock transfer request ${error}`,
            tag: "Stock transfer request",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
});
StockRequestController.deleteByID = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    stock_request_model_1.default.fetchByID(id)
        .then((stockRequest) => {
        if (!stockRequest || stockRequest.isDelete) {
            return res.status(404).send(error_list_1.ErrorList["STOCK_REQUEST_NOT_FOUND"]);
        }
        else if (stockRequest.isReject) {
        }
        else if (!stockRequest.isSending) {
            stock_request_model_1.default.deleteByID(id, userID).then((result) => {
                return res.status(201).send(result);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching stock request: ${error.message}`,
            tag: "Stock request",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StockRequestController.fetchIncompleteRequests = (req, res) => {
};
StockRequestController.send = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.body.id;
    const userID = req.body.userID;
    const items = req.body.items;
    const stockRequest = yield stock_request_model_1.default.fetchByID(id);
    if (!stockRequest || stockRequest.isDelete) {
        return res.status(404).send(error_list_1.ErrorList["STOCK_REQUEST_NOT_FOUND"]);
    }
    if (stockRequest.isConfirm || stockRequest.isReject) {
        return res.status(405).send(error_list_1.ErrorList["STOCK_REQUEST_ALREADY_PROCESSED"]);
    }
    if (stockRequest.isSending) {
        return res.status(405).send(error_list_1.ErrorList["STOCK_REQUEST_ALREADY_SENT"]);
    }
    yield lock_utils_1.default.acquire(items.map((x) => x.itemID.toString()), (done) => __awaiter(void 0, void 0, void 0, function* () {
        stock_model_1.default.checkStockByItemIDs(items.map((x) => {
            return {
                itemID: x.itemID,
                quantity: x.quantity,
            };
        }), stockRequest.requestTo).then((stocks) => {
            let validation = true;
            for (let i = 0; i < stockRequest.items.length; i++) {
                const stockIndex = stocks.findIndex((x) => x.itemID.toString() == items[i].itemID);
                const stock = stockIndex == -1 ? 0 : stocks[stockIndex].quantity;
                if (stock < items[i].quantity) {
                    validation = false;
                }
            }
            if (!validation) {
                done();
                return res.status(405).send(error_list_1.ErrorList["INSUFFICIENT_STOCK"]);
            }
            else {
                stock_request_model_1.default.send({
                    id: id,
                    createdBy: userID,
                    items: items,
                })
                    .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                    items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                        yield new stock_model_1.default({
                            storeID: stockRequest.requestTo,
                            itemID: x.itemID,
                            quantity: x.quantity * -1,
                        }).update();
                    }));
                    done();
                    return res.status(201).send(result);
                }))
                    .catch((error) => {
                    new logger_utils_1.default({
                        type: logger_interface_1.LoggerType.error,
                        message: `Error on sending stock request ${error}`,
                        tag: "StockRequest",
                    }).log();
                    done();
                    return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
                });
            }
        });
    }));
});
StockRequestController.checkStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.body.id;
    const stockRequest = yield stock_request_model_1.default.fetchByID(id);
    if (!stockRequest || stockRequest.isDelete) {
        return res.status(404).send(error_list_1.ErrorList["STOCK_REQUEST_NOT_FOUND"]);
    }
    else if (stockRequest.isConfirm || stockRequest.isReject) {
        return res.status(405).send(error_list_1.ErrorList["STOCK_REQUEST_ALREADY_PROCESSED"]);
    }
    else {
        req.body.stockRequest = stockRequest;
        next();
    }
});
StockRequestController.confirm = (req, res) => {
    const id = req.body.id;
    const stockRequest = req.body.stockRequest;
    const userID = req.body.userID;
    stock_request_model_1.default.confirmByID(id, userID).then((result) => __awaiter(void 0, void 0, void 0, function* () {
        yield lock_utils_1.default.acquire(result.items.map((x) => {
            return `${x.itemID}:${stockRequest.requestFrom == null ? "" : stockRequest.requestFrom}`;
        }), (done) => {
            stockRequest.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                yield new stock_model_1.default({
                    itemID: x.itemID,
                    quantity: x.quantity,
                    storeID: stockRequest.requestFrom,
                }).update();
            }));
            done();
            return res.status(201).send(result);
        });
    }));
};
StockRequestController.fetchIncompletedRequests = (req, res) => {
};
StockRequestController.fetchUnsentRequests = (req, res) => {
    const requestTo = req.body.requestTo;
    const page = req.body.page;
    stock_request_model_1.default.fetchUnsent(page, requestTo)
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching unsent request ${error}`,
            tag: "Stock request",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StockRequestController.fetchUnreceivedRequests = (req, res) => {
    const requestFrom = req.body.requestFrom;
    const page = req.body.page;
    stock_request_model_1.default.fetchUnreceived(page, requestFrom)
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching unsent request ${error}`,
            tag: "Stock request",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StockRequestController.receive = (req, res) => {
    const id = req.body.id;
    const userID = req.body.userID;
    stock_request_model_1.default.fetchByID(id)
        .then((stockRequest) => {
        if (!stockRequest || stockRequest.iDelete) {
            return res.status(404).send(error_list_1.ErrorList["STOCK_REQUEST_NOT_FOUND"]);
        }
        else if (!stockRequest.isSending) {
            return res.status(400).send(error_list_1.ErrorList["STOCK_REQUEST_NOT_SENT"]);
        }
        else if (stockRequest.isConfirm || stockRequest.isReject) {
            return res
                .status(400)
                .send(error_list_1.ErrorList["STOCK_REQUEST_ALREADY_CONFIRMED"]);
        }
        else {
            stock_request_model_1.default.confirmByID(id, userID)
                .then(() => __awaiter(void 0, void 0, void 0, function* () {
                yield lock_utils_1.default.acquire(stockRequest.items.map((x) => {
                    return `${x.itemID._id}:${stockRequest.requestFrom}`;
                }), (done) => {
                    stockRequest.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                        yield new stock_model_1.default({
                            itemID: x.itemID._id,
                            quantity: x.quantity,
                            storeID: stockRequest.requestFrom,
                        }).update();
                    }));
                    done();
                    return res.status(201).send(stockRequest);
                });
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on receiving stock request ${error}`,
                    tag: "Stock request",
                    type: logger_interface_1.LoggerType.error,
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching stock request ${error}`,
            tag: "Stock request",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = StockRequestController;
//# sourceMappingURL=stock-request.controller.js.map