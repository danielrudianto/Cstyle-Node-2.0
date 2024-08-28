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
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const error_list_1 = require("../data/error-list");
const packing_list_model_1 = __importDefault(require("../models/packing-list.model"));
const delivery_slip_model_1 = __importDefault(require("../models/delivery-slip.model"));
const lock_utils_1 = __importDefault(require("../utils/lock.utils"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
const queue_utils_1 = require("../utils/queue.utils");
class InvoiceController {
}
_a = InvoiceController;
InvoiceController.fetch = (req, res) => {
    const page = req.body.page;
    const month = req.body.month;
    const year = req.body.year;
    const status = req.body.status;
    const paymentStatus = req.body.paymentStatus;
    const keyword = req.body.keyword;
    invoice_model_1.default.fetch({
        page: page,
        keyword: keyword,
        month: month + 1,
        year: year,
        status: status,
        paymentStatus: paymentStatus,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching sales invoice ${error}`,
            tag: "Sales invoice",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
InvoiceController.fetchByID = (req, res) => {
    const id = req.params.id;
    invoice_model_1.default.fetchByID(id)
        .then((result) => __awaiter(void 0, void 0, void 0, function* () {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["SALES_INVOICE_NOT_FOUND"]);
        }
        else {
            if (result.packingListID) {
                const packingList = yield packing_list_model_1.default.fetchByID(result.packingListID._id);
                console.log(packingList);
                result.packingListID = packingList;
                return res.status(200).send(result);
            }
            else {
                const deliverySlip = yield delivery_slip_model_1.default.fetchByID(result.deliverySlipID._id);
                result.deliverySlipID = deliverySlip;
                return res.status(200).send(result);
            }
        }
    }))
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching sales invoice ${error}`,
            tag: "Sales invoice",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
InvoiceController.updatePayment = (req, res) => {
    const id = req.body.id;
    const paidAt = req.body.paidAt;
    const method = req.body.paymentMethod;
    const amount = req.body.amount;
    const userID = req.body.userID;
    invoice_model_1.default.fetchByID(id)
        .then((result) => {
        if (!result || result.isDelete) {
            return res.status(404).send(error_list_1.ErrorList["SALES_INVOICE_NOT_FOUND"]);
        }
        else if (result.isPaid) {
            return res.status(400).send(error_list_1.ErrorList["SALES_INVOICE_PAID"]);
        }
        else {
            invoice_model_1.default.updatePayment({
                id: id,
                paidAt: paidAt,
                paymentMethod: method,
                amount: amount,
                paidBy: userID,
            })
                .then(() => {
                return res.status(200).send({
                    paidAt: paidAt,
                    paymentMethod: method,
                    amount: amount,
                    paidBy: userID,
                });
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on fetching sales invoice ${error}`,
                    tag: "Sales invoice",
                    type: logger_interface_1.LoggerType.error,
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching sales invoice ${error}`,
            tag: "Sales invoice",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
InvoiceController.deleteByID = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    invoice_model_1.default.fetchByID(id).then((result) => {
        if (!result || result.isDelete) {
            return res.status(404).send(error_list_1.ErrorList["SALES_INVOICE_NOT_FOUND"]);
        }
        else {
            invoice_model_1.default.deleteByID(id, userID)
                .then(() => __awaiter(void 0, void 0, void 0, function* () {
                if (result.packingListID) {
                    yield lock_utils_1.default.acquire(result.packingListID.items.map((x) => {
                        return `x.itemID:`;
                    }), (done) => __awaiter(void 0, void 0, void 0, function* () {
                        result.packingListID.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                            yield new stock_model_1.default({
                                itemID: x.itemID,
                                quantity: x.quantity,
                                storeID: null,
                            }).update();
                            const stockOutData = {
                                itemID: x.itemID,
                                adjustmentCaseID: null,
                                quantity: x.quantity,
                                billID: null,
                                invoiceID: id,
                                storeID: null,
                            };
                            yield queue_utils_1.queue.add("removeStockOut", stockOutData);
                        }));
                        yield packing_list_model_1.default.deleteByID(result.packingListID._id, userID);
                        done();
                        return res.status(201).send(result);
                    }));
                }
                else {
                    yield lock_utils_1.default.acquire(result.deliverySlipID.items.map((x) => {
                        return `x.itemID:`;
                    }), (done) => __awaiter(void 0, void 0, void 0, function* () {
                        result.packingListID.items.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                            yield new stock_model_1.default({
                                itemID: x.itemID,
                                quantity: x.quantity - x.returned,
                                storeID: null,
                            }).update();
                            const stockOutData = {
                                itemID: x.itemID,
                                adjustmentCaseID: null,
                                quantity: x.quantity,
                                billID: null,
                                invoiceID: id,
                                storeID: null,
                            };
                            yield queue_utils_1.queue.add("removeStockOut", stockOutData);
                        }));
                        yield delivery_slip_model_1.default.deleteByID(result.deliverySlipID._id, userID);
                        done();
                        return res.status(201).send(result);
                    }));
                }
            }))
                .catch((error) => { });
        }
    });
};
InvoiceController.deletePaymentByID = (req, res) => {
    const id = req.params.id;
    invoice_model_1.default.deletePaymentByID(id)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on deleting payment ${error}`,
            tag: "Sales invoice",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = InvoiceController;
//# sourceMappingURL=invoice.controller.js.map