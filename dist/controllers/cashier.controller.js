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
const bill_model_1 = __importDefault(require("../models/bill.model"));
const moment_1 = __importDefault(require("moment"));
const membership_model_1 = __importDefault(require("../models/membership.model"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
const error_list_1 = require("../data/error-list");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const queue_utils_1 = require("../utils/queue.utils");
const store_model_1 = __importDefault(require("../models/store.model"));
const lock_utils_1 = __importDefault(require("../utils/lock.utils"));
const item_model_1 = __importDefault(require("../models/item.model"));
class CashierController {
}
_a = CashierController;
CashierController.sync = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const storeID = req.body.storeID;
    const data = req.body.data;
    const memberCodeSet = new Set();
    const bills = [];
    bill_model_1.default.fetchBillByNames(data.map((x) => x.name)).then((existingBills) => __awaiter(void 0, void 0, void 0, function* () {
        data
            .filter((x) => !existingBills.map((y) => y.name).includes(x.name))
            .forEach((x) => {
            if (x.memberID != null) {
                memberCodeSet.add(x.memberID);
            }
            const bill = new bill_model_1.default({
                name: x.name,
                date: (0, moment_1.default)(x.date).format("YYYY-MM-DD"),
                memberID: x.memberID,
                storeID: storeID,
                createdBy: x.createdBy,
                createdAt: new Date(x.createdAt),
                items: x.bills.map((a) => {
                    return {
                        itemID: a.itemID,
                        quantity: a.quantity,
                        price: a.price,
                        discount: (a.discount * a.price) / 100,
                        percentage: a.discount,
                    };
                }),
                payment: x.payments.map((b) => {
                    return {
                        type: b.paymentMethod,
                        amount: b.amount,
                    };
                }),
            });
            bills.push(bill);
        });
        const memberIDs = yield membership_model_1.default.fetchByIDs([
            ...memberCodeSet,
        ]);
        const modifiedBills = [];
        bills.forEach((x) => {
            const member = memberIDs.find((y) => y.code == x.memberID);
            if (x.memberID != null && member == null) {
                return;
            }
            else {
                modifiedBills.push(Object.assign(Object.assign({}, x), { memberID: x.memberID == null ? null : member._id }));
            }
        });
        const groupedData = modifiedBills.reduce((acc, current) => {
            current.items.forEach((item) => {
                if (!acc[item.itemID.toString()]) {
                    acc[item.itemID.toString()] = {
                        itemID: item.itemID.toString(),
                        quantity: 0,
                    };
                }
                acc[item.itemID.toString()].quantity += item.quantity;
            });
            return acc;
        }, {});
        yield lock_utils_1.default.acquire(Object.entries(groupedData).map(([_, value]) => {
            return `${value.itemID}:${storeID}`;
        }), (done) => __awaiter(void 0, void 0, void 0, function* () {
            stock_model_1.default.checkStockByItemIDs(Object.entries(groupedData).map(([_, value]) => {
                return { itemID: value.itemID, quantity: value.quantity };
            }), storeID)
                .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                const comparisonResults = result.map((item) => {
                    const groupedItem = groupedData[item.itemID];
                    return groupedItem.quantity <= item.quantity;
                });
                if (comparisonResults.includes(false)) {
                    done();
                    new logger_utils_1.default({
                        message: `Error on insufficient stock ${comparisonResults}`,
                        type: logger_interface_1.LoggerType.error,
                        tag: "Cashier",
                    }).log();
                    return res.status(400).send(error_list_1.ErrorList["INSUFFICIENT_STOCK"]);
                }
                else {
                    bill_model_1.default.insertMany(modifiedBills.filter((x) => {
                        return !existingBills.map((y) => y.name).includes(x.name);
                    }))
                        .then((result) => {
                        result.forEach((x) => __awaiter(void 0, void 0, void 0, function* () {
                            x.items.forEach((y) => __awaiter(void 0, void 0, void 0, function* () {
                                yield new stock_model_1.default({
                                    itemID: y.itemID,
                                    quantity: y.quantity * -1,
                                    storeID: x.storeID,
                                }).update();
                            }));
                            yield queue_utils_1.queue.add("createBill", {
                                id: x._id,
                            });
                        }));
                        done();
                        return res.status(200).send(result);
                    })
                        .catch((error) => {
                        new logger_utils_1.default({
                            message: `Error on creating bill ${error}`,
                            type: logger_interface_1.LoggerType.error,
                            tag: "Cashier",
                        }).log();
                        done();
                        return res
                            .status(500)
                            .send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
                    });
                }
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on checking stock ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "Cashier",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }));
    }));
});
CashierController.stats = (req, res) => {
    const storeID = req.body.storeID;
    const period = Number(req.query.period);
    Promise.all([
        membership_model_1.default.countNewMembers(storeID),
        membership_model_1.default.countMembers(storeID),
        bill_model_1.default.countBills(storeID, period),
    ])
        .then(([newMember, totalMember, [billCount, billSales]]) => {
        return res
            .status(200)
            .send([
            newMember,
            totalMember,
            billCount,
            billSales.length == 0 ? 0 : Math.round(billSales[0].value),
        ]);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching stats ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Cashier",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
CashierController.checkStore = (req, res) => {
    var uid = req.params.storeCode;
    let formattedUID = "";
    if (uid.match(/^[0-9a-fA-F]{32}$/)) {
        formattedUID =
            uid.substring(0, 8) +
                "-" +
                uid.substring(8, 12) +
                "-" +
                uid.substring(12, 16) +
                "-" +
                uid.substring(16, 20) +
                "-" +
                uid.substring(20, 32);
        store_model_1.default.fetchByCode(formattedUID.toLowerCase())
            .then((result) => {
            return res.status(200).send(result);
        })
            .catch((error) => {
            new logger_utils_1.default({
                message: `Error on fetching store ${error}`,
                tag: "Store",
                type: logger_interface_1.LoggerType.error,
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    }
    else {
        return res.status(400).send(error_list_1.ErrorList["INVALID_STORE_UID"]);
    }
};
CashierController.fetchStock = (req, res) => {
    const storeID = req.body.storeID;
    stock_model_1.default.fetchByStoreID(storeID)
        .then((result) => {
        return res.status(200).send(result.map((x) => {
            return {
                mongoID: x.itemID,
                stock: x.quantity,
            };
        }));
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching stock data ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Cashier",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
CashierController.fetchReport = (req, res) => {
    const storeID = req.body.storeID;
    bill_model_1.default.fetchStoreReport(storeID)
        .then((bills) => {
        const paymentMethods = [
            "cash",
            "card",
            "qris",
            "paypal",
            "voucher",
            "bank transfer",
        ];
        const payments = paymentMethods.map((x) => {
            return {
                type: x,
                value: 0,
            };
        });
        bills.forEach((bill) => {
            bill.payment.forEach((payment) => {
                const index = payments.findIndex((x) => x.type.toLowerCase() === payment.type.toLowerCase());
                payments[index].value += payment.amount;
            });
        });
        return res.status(200).send({
            count: bills.length,
            payments: payments,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching report ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Cashier",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
CashierController.checkStock = (req, res) => {
    const storeID = req.body.storeID;
    const keyword = req.body.keyword;
    const page = req.body.page;
    Promise.all([
        item_model_1.default.fetch({
            keyword: keyword,
            page: page,
            onlyActive: true,
        }),
        store_model_1.default.fetchOthers(storeID),
    ])
        .then(([[result, count], stores]) => {
        stock_model_1.default.fetchCashier(result.map((x) => x._id))
            .then((stocks) => {
            return res.status(200).send({
                store: stores,
                data: result.map((x) => {
                    var _b;
                    const stockArray = stocks.filter((y) => y._id.itemID.toString() === x._id.toString());
                    return {
                        id: x._id,
                        reference: x.reference,
                        description: x.description,
                        brand: x.itemBrandID == null ? "" : x.itemBrandID.name,
                        type: x.itemTypeID == null ? "" : x.itemTypeID.name,
                        stock: (_b = stockArray.map((z) => {
                            return {
                                storeID: z._id.storeID,
                                quantity: z.quantity,
                            };
                        })) !== null && _b !== void 0 ? _b : [],
                    };
                }),
                count: count,
            });
        })
            .catch((error) => {
            new logger_utils_1.default({
                message: `Error on fetching stock ${error}`,
                type: logger_interface_1.LoggerType.error,
                tag: "Cashier",
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching items ${error}`,
            tag: "Cashier",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
CashierController.fetchBill = (req, res) => {
    const storeID = req.body.storeID;
    const page = req.query.page == undefined ? 1 : Number(req.query.page);
    bill_model_1.default.fetchStore({
        storeID: storeID,
        page: page,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching bill ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Cashier",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
CashierController.fetchBillByID = (req, res) => {
    const id = req.params.id;
    const storeID = req.body.storeID;
    bill_model_1.default.fetchByID(id)
        .then((result) => {
        if (result.storeID.toString() != req.body.storeID.toString()) {
            return res.status(403).send(error_list_1.ErrorList["ACCESS_DENIED"]);
        }
        else {
            return res.status(200).send(result);
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching bill by ID ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Cashier",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = CashierController;
//# sourceMappingURL=cashier.controller.js.map