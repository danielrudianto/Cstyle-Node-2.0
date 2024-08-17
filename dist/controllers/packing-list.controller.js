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
const packing_list_model_1 = __importDefault(require("../models/packing-list.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const error_list_1 = require("../data/error-list");
const stock_model_1 = __importDefault(require("../models/stock.model"));
const queue_utils_1 = require("../utils/queue.utils");
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const lock_utils_1 = __importDefault(require("../utils/lock.utils"));
class PackingListController {
}
_a = PackingListController;
PackingListController.create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const date = req.body.date;
    const dueDate = req.body.dueDate;
    const note = req.body.note;
    const invoiceNote = req.body.invoiceNote;
    const items = req.body.items;
    const customerID = req.body.customerID;
    const salesID = req.body.salesID;
    const userID = req.body.userID;
    const modifiedItems = packing_list_model_1.default.preCreate(items);
    stock_model_1.default.checkStockByItemIDs(modifiedItems.map((x) => {
        return {
            itemID: x.itemID,
            quantity: x.quantity,
        };
    }), null).then((stock) => __awaiter(void 0, void 0, void 0, function* () {
        let validation = true;
        for (let i = 0; i < modifiedItems.length; i++) {
            const x = modifiedItems[i];
            const stockIndex = stock.findIndex((y) => y.itemID.toString() == x.itemID);
            if (stockIndex < 0 || stock[stockIndex].quantity < x.quantity) {
                validation = false;
            }
        }
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["INSUFFICIENT_STOCK"]);
        }
        else {
            const name = yield packing_list_model_1.default.generateName(new Date(date));
            new packing_list_model_1.default({
                name: name,
                date: date,
                note: note,
                items: modifiedItems,
                salesID: salesID,
                customerID: customerID,
                createdBy: userID,
            })
                .create()
                .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                const invoiceName = yield invoice_model_1.default.generateName(new Date(date));
                new invoice_model_1.default({
                    name: invoiceName,
                    date: date,
                    dueDate: dueDate,
                    note: invoiceNote,
                    packingListID: result._id,
                    deliverySlipID: null,
                    createdBy: userID,
                    customerID: customerID,
                    salesID: salesID,
                })
                    .create()
                    .then((salesInvoice) => __awaiter(void 0, void 0, void 0, function* () {
                    yield lock_utils_1.default.acquire(result.items.map((x) => {
                        return `${x.itemID}:`;
                    }), (done) => {
                        result.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                            const data = {
                                itemID: x.itemID,
                                quantity: x.quantity,
                                invoiceID: salesInvoice._id,
                                billID: null,
                                adjustmentEventID: null,
                                date: date,
                                storeID: null,
                            };
                            yield queue_utils_1.queue.add("insertStockOut", data);
                            yield new stock_model_1.default({
                                itemID: x.itemID,
                                quantity: x.quantity * -1,
                                storeID: null,
                            }).update();
                        }));
                        done();
                        return res.status(201).send(result);
                    });
                }))
                    .catch((error) => {
                    new logger_utils_1.default({
                        message: `Error on creating invoice ${error}`,
                        type: logger_interface_1.LoggerType.error,
                        tag: "Invoice",
                    }).log();
                    return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
                });
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on creating packing list ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "Packing list",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    }));
});
PackingListController.fetch = (req, res) => {
    const keyword = req.body.keyword;
    const month = req.body.month + 1;
    const year = req.body.year;
    const page = req.body.page;
    const status = req.body.status;
    packing_list_model_1.default.fetch({
        keyword: keyword,
        month: month,
        year: year,
        status: status,
        page: page,
    }).then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    });
};
PackingListController.fetchByID = (req, res) => {
    const id = req.params.id;
    Promise.all([
        packing_list_model_1.default.fetchByID(id),
        invoice_model_1.default.fetchByPackingListID(id),
    ])
        .then(([packingList, salesInvoice]) => {
        if (!packingList || !salesInvoice) {
            return res.status(404).send(error_list_1.ErrorList["PACKING_LIST_NOT_FOUND"]);
        }
        else {
            return res.status(200).send({
                packingList: packingList,
                salesInvoice: salesInvoice,
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching packing list ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Packing list",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = PackingListController;
//# sourceMappingURL=packing-list.controller.js.map