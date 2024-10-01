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
const app_1 = require("../app");
const bill_model_1 = __importDefault(require("../models/bill.model"));
const error_list_1 = require("../data/error-list");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const lock_utils_1 = __importDefault(require("../utils/lock.utils"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
const queue_utils_1 = require("../utils/queue.utils");
class BillController {
}
_a = BillController;
BillController.fetch = (req, res) => {
    const userID = req.body.userID;
    const page = req.body.page;
    const keyword = req.body.keyword;
    const month = req.body.month;
    const year = req.body.year;
    const storeID = req.body.storeID;
    app_1.redisClient
        .get(`users:${userID}`)
        .then((data) => {
        const user = JSON.parse(data);
        const role = user.accessLevel;
        bill_model_1.default.fetch({
            month: month,
            year: year,
            page: page,
            keyword: keyword,
            storeID: storeID,
            isOwner: role == 1,
        })
            .then(([result, count]) => {
            return res.status(200).send({
                data: result,
                count: count,
            });
        })
            .catch((error) => {
            new logger_utils_1.default({
                message: `Error on fetching bills ${error}`,
                type: logger_interface_1.LoggerType.error,
                tag: "Bill",
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user on bill ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Bill",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
BillController.fetchByID = (req, res) => {
    const id = req.params.id;
    bill_model_1.default.fetchByID(id)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching bill by ID ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Bill",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
BillController.deleteByID = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    bill_model_1.default.fetchByID(id)
        .then((bill) => {
        if (!bill) {
            return res.status(404).send(error_list_1.ErrorList["BILL_NOT_FOUND"]);
        }
        if (bill.isDelete) {
            return res.status(400).send(error_list_1.ErrorList["BILL_DELETED"]);
        }
        bill_model_1.default.deleteByID({
            id: id,
            userID: userID,
        })
            .then(() => __awaiter(void 0, void 0, void 0, function* () {
            yield lock_utils_1.default.acquire(bill.items.map((item) => {
                return `${item.itemID}:${bill.storeID}`;
            }), (done) => {
                bill.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                    yield new stock_model_1.default({
                        itemID: x.itemID._id,
                        quantity: x.quantity,
                        storeID: bill.storeID,
                    }).update();
                    yield queue_utils_1.queue.add("removeStockOut", {
                        itemID: x.itemID._id.toString(),
                        adjustmentCaseID: null,
                        quantity: x.quantity,
                        storeID: bill.storeID,
                        billID: id,
                        invoiceID: null,
                    });
                }));
                done();
                return res.status(200).send(bill);
            });
        }))
            .catch((error) => {
            new logger_utils_1.default({
                message: `Error on deleting bill ${error}`,
                type: logger_interface_1.LoggerType.error,
                tag: "Bill",
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching bill by ID ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Bill",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = BillController;
//# sourceMappingURL=bill.controller.js.map