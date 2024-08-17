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
const delivery_slip_model_1 = __importDefault(require("../models/delivery-slip.model"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const queue_utils_1 = require("../utils/queue.utils");
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
class DeliverySlipController {
}
_a = DeliverySlipController;
DeliverySlipController.create = (req, res) => {
    const date = req.body.date;
    const items = req.body.items;
    const customerID = req.body.customerID;
    const salesID = req.body.salesID;
    const userID = req.body.userID;
    const note = req.body.note;
    const modifiedItems = delivery_slip_model_1.default.preCreate(items);
    stock_model_1.default.checkStockByItemIDs(modifiedItems.map((x) => {
        return {
            itemID: x.itemID,
            quantity: x.quantity,
        };
    }), null)
        .then((stock) => __awaiter(void 0, void 0, void 0, function* () {
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
            const name = yield delivery_slip_model_1.default.generateName(new Date(date));
            new delivery_slip_model_1.default({
                name: name,
                date: date,
                customerID: customerID,
                salesID: salesID,
                items: modifiedItems,
                createdBy: userID,
                note: note,
                isDelete: false,
                isReturn: false,
                deletedAt: null,
                deletedBy: null,
                returnedAt: null,
            })
                .create()
                .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                result.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                    yield queue_utils_1.queue.add("insertStockOutTemp", {
                        itemID: x.itemID,
                        quantity: x.quantity,
                        deliverySlipID: result._id,
                    });
                }));
                return res.status(201).send(result);
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on creating delivery slip ${error}`,
                    tag: "Delivery slip",
                    type: logger_interface_1.LoggerType.error,
                });
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    }))
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching stock ${error}`,
            tag: "Delivery slip",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
DeliverySlipController.fetch = (req, res) => {
    const page = req.body.page;
    const keyword = req.body.keyword;
    const month = req.body.month;
    const year = req.body.year;
    const status = req.body.status;
    delivery_slip_model_1.default.fetch({
        page: page,
        keyword: keyword,
        month: month + 1,
        year: year,
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
            message: `Error on fetching delivery slip ${error}`,
            tag: "Delivery slip",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
DeliverySlipController.fetchByID = (req, res) => {
    const id = req.params.id;
    delivery_slip_model_1.default.fetchByID(id)
        .then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["DELIVERY_SLIP_NOT_FOUND"]);
        }
        else {
            return res.status(200).send(result);
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching delivery slip ${error}`,
            tag: "Delivery slip",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
DeliverySlipController.fetchByIDWInvoice = (req, res) => {
    const id = req.params.id;
    Promise.all([
        delivery_slip_model_1.default.fetchByID(id),
        invoice_model_1.default.fetchByDeliverySlipID(id),
    ])
        .then(([deliverySlip, salesInvoice]) => {
        return res.status(200).send({
            deliverySlip: deliverySlip,
            salesInvoice: salesInvoice,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching delivery slip ${error}`,
            tag: "Delivery slip",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
DeliverySlipController.fetchUnconfirmed = (req, res) => {
    const page = !req.query.page ? 1 : Number(req.query.page);
    delivery_slip_model_1.default.fetchUnconfirmed(page)
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching unconfirmed delivery slips ${error}`,
            tag: "Delivery slips",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
DeliverySlipController.confirm = (req, res) => {
    const items = req.body.items;
    const invoiceDueDate = new Date(req.body.invoiceDueDate);
    const invoiceDate = new Date(req.body.invoiceDate);
    const invoiceNote = req.body.invoiceNote;
    const deliverySlipID = req.body.id;
    delivery_slip_model_1.default.fetchByID(deliverySlipID).then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["DELIVERY_SLIP_NOT_FOUND"]);
        }
        if (result.isDelete) {
            return res.status(400).send(error_list_1.ErrorList["DELIVERY_SLIP_DELETED"]);
        }
        if (result.isReturn) {
            return res.status(400).send(error_list_1.ErrorList["DELIVERY_SLIP_RETURNED"]);
        }
        delivery_slip_model_1.default.update({
            id: deliverySlipID,
            items: items,
            returnedAt: invoiceDate,
        }).then((result) => __awaiter(void 0, void 0, void 0, function* () {
            for (let i = 0; i < result.items.length; i++) {
                const data = {
                    date: result.date,
                    quantity: result.items[i].quantity,
                    itemID: result.items[i].itemID,
                    deliverySlipID: deliverySlipID,
                };
                yield queue_utils_1.queue.add("removeStockOutTemp", data);
            }
            const invoiceName = yield invoice_model_1.default.generateName(invoiceDate);
            new invoice_model_1.default({
                name: invoiceName,
                date: invoiceDate,
                dueDate: invoiceDueDate,
                note: invoiceNote,
                isDelete: false,
                isHidden: false,
                deliverySlipID: deliverySlipID,
                packingListID: null,
                createdBy: req.body.userID,
                salesID: result.salesID,
                customerID: result.customerID,
            })
                .create()
                .then((salesInvoice) => __awaiter(void 0, void 0, void 0, function* () {
                for (let i = 0; i < result.items.length; i++) {
                    const data = {
                        date: invoiceDate,
                        quantity: result.items[i].quantity,
                        itemID: result.items[i].itemID,
                        invoiceID: salesInvoice._id,
                        adjustmentEventID: null,
                        billID: null,
                        storeID: null,
                    };
                    yield queue_utils_1.queue.add("insertStockOut", data);
                }
                return res.status(201).send(result);
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on creating invoice ${error}`,
                    tag: "Invoice",
                    type: logger_interface_1.LoggerType.error,
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }));
    });
};
exports.default = DeliverySlipController;
//# sourceMappingURL=delivery-slip.controller.js.map