"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bill_model_1 = __importDefault(require("../models/bill.model"));
const error_list_1 = require("../data/error-list");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const app_1 = require("../app");
const stock_out_model_1 = __importDefault(require("../models/stock-out.model"));
const good_receipt_model_1 = require("../models/good-receipt.model");
const moment_1 = __importDefault(require("moment"));
class ReportController {
}
ReportController.fetchSalesReport = (req, res) => {
    const storeID = req.body.store;
    const month = req.body.month;
    const year = req.body.year;
    const userID = req.body.userID;
    app_1.redisClient
        .get(`users:${userID}`)
        .then((user) => {
        const data = JSON.parse(user);
        const accessLevel = data.accessLevel;
        if (accessLevel != 0 && accessLevel != 4) {
            return res.status(400).send(error_list_1.ErrorList["ACCESS_DENIED"]);
        }
        else {
            Promise.all([
                bill_model_1.default.fetchReport(storeID, month, year),
                storeID == null
                    ? invoice_model_1.default.fetchReport(month, year, accessLevel === 0)
                    : Promise.resolve([]),
            ])
                .then(([bills, invoices]) => {
                return res.status(200).send({
                    bills: bills.map((x, index) => {
                        const QRISPaymentIndex = x.payment.findIndex((a) => a.type.toLowerCase() === "qris");
                        const CashPaymentIndex = x.payment.findIndex((a) => a.type.toLowerCase() === "cash");
                        const PayPalPaymentIndex = x.payment.findIndex((a) => a.type.toLowerCase() === "paypal");
                        const VoucherPaymentIndex = x.payment.findIndex((a) => a.type.toLowerCase() === "voucher");
                        const BankTransferPaymentIndex = x.payment.findIndex((a) => a.type.toLowerCase() === "bank transfer" ||
                            a.type.toLowerCase() === "transfer");
                        const CardPaymentIndex = x.payment.findIndex((a) => a.type.toLowerCase() === "card");
                        const QRISPayment = QRISPaymentIndex !== -1
                            ? x.payment[QRISPaymentIndex].amount
                            : 0;
                        const CashPayment = CashPaymentIndex !== -1
                            ? x.payment[CashPaymentIndex].amount
                            : 0;
                        const PayPalPayment = PayPalPaymentIndex !== -1
                            ? x.payment[PayPalPaymentIndex].amount
                            : 0;
                        const VoucherPayment = VoucherPaymentIndex !== -1
                            ? x.payment[VoucherPaymentIndex].amount
                            : 0;
                        const BankTransferPayment = BankTransferPaymentIndex !== -1
                            ? x.payment[BankTransferPaymentIndex].amount
                            : 0;
                        const CardPayment = CardPaymentIndex !== -1
                            ? x.payment[CardPaymentIndex].amount
                            : 0;
                        return {
                            No: index + 1,
                            ID: x._id,
                            "Bill Number": x.name,
                            Date: (0, moment_1.default)(x.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
                            Time: (0, moment_1.default)(x.createdAt).format("HH:mm:ss"),
                            Value: x.items.reduce((acc, item) => acc +
                                Math.floor((item.price - item.discount) / 1000) *
                                    1000 *
                                    item.quantity, 0),
                            Cash: CashPayment,
                            Card: CardPayment,
                            "Bank Transfer": BankTransferPayment,
                            PayPal: PayPalPayment,
                            QRIS: QRISPayment,
                            Voucher: VoucherPayment,
                            "Created by": x.createdBy.name,
                            Member: x.memberID == null ? "NO" : x.memberID.code,
                            Remarks: x.isHidden ? "H" : "",
                            Staff: x.createdBy.name,
                        };
                    }),
                    invoices: invoices.map((x, index) => {
                        return {
                            No: index + 1,
                            ID: x._id,
                            "Invoice Number": x.name,
                            Date: (0, moment_1.default)(x.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
                            Time: (0, moment_1.default)(x.createdAt).format("HH:mm:ss"),
                            Value: x.packingListID.items.reduce((acc, item) => acc +
                                Math.floor((item.price - item.discount) / 1000) *
                                    1000 *
                                    item.quantity, 0),
                            Customer: x.customerID == null ? "?NO" : x.customerID.name,
                            Staff: x.createdBy.name,
                            Remarks: x.isHidden ? "H" : "",
                        };
                    }),
                });
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on fetching sales report data ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "Sales report",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user data ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Sales report",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ReportController.fetchSalesProductReport = (req, res) => {
    const storeID = req.body.store;
    const month = req.body.month;
    const year = req.body.year;
    const userID = req.body.userID;
    app_1.redisClient
        .get(`users:${userID}`)
        .then((user) => {
        const data = JSON.parse(user);
        const accessLevel = data.accessLevel;
        if (accessLevel != 0 && accessLevel != 4) {
            return res.status(400).send(error_list_1.ErrorList["ACCESS_DENIED"]);
        }
        else {
            Promise.all([
                bill_model_1.default.fetchProductReport(storeID, month, year),
                storeID == null
                    ? invoice_model_1.default.fetchProductReport(month, year, accessLevel === 0)
                    : Promise.resolve([]),
                stock_out_model_1.default.fetchProductReport(month, year),
            ])
                .then(([bills, invoices, stockouts]) => {
                const billsResult = [];
                bills.forEach((bill) => {
                    const billID = bill._id.toString();
                    for (let i = 0; i < bill.items.length; i++) {
                        const itemID = bill.items[i].itemID;
                        const stockOut = stockouts.filter((stockout) => {
                            return ((stockout.billID == null
                                ? null
                                : stockout.billID.toString()) === billID &&
                                stockout.itemID.toString() === itemID._id.toString());
                        });
                        const stockOutPrice = stockOut.reduce((acc, stockout) => acc + stockout.stockIn.price * stockout.quantity, 0);
                        const averagePrice = stockOutPrice;
                        billsResult.push({
                            Bill: bill.name,
                            Date: (0, moment_1.default)(bill.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
                            Time: (0, moment_1.default)(bill.createdAt).format("HH:mm:ss"),
                            Article: bill.items[i].itemID.reference,
                            Reference: bill.items[i].itemID.description,
                            Quantity: bill.items[i].quantity,
                            Price: Math.floor((bill.items[i].price - bill.items[i].discount) / 1000) * 1000,
                            Cost: averagePrice,
                            Staff: bill.createdBy.name,
                        });
                    }
                });
                const invoicesResult = [];
                invoices.forEach((invoice) => {
                    const invoiceID = invoice._id.toString();
                    if (invoice.packingListID != null) {
                        for (let i = 0; i < invoice.packingListID.items.length; i++) {
                            const itemID = invoice.packingListID.items[i].itemID;
                            const stockOut = stockouts.filter((stockout) => {
                                return (stockout.itemID.toString() === itemID._id.toString() &&
                                    (stockout.invoiceID == null
                                        ? null
                                        : stockout.invoiceID.toString()) === invoiceID);
                            });
                            const stockOutPrice = stockOut.reduce((acc, stockout) => acc + stockout.stockIn.price * stockout.quantity, 0);
                            const averagePrice = stockOutPrice;
                            invoicesResult.push({
                                Invoice: invoice.name,
                                Date: (0, moment_1.default)(invoice.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
                                Time: (0, moment_1.default)(invoice.createdAt).format("HH:mm:ss"),
                                Article: invoice.packingListID.items[i].itemID.reference,
                                Reference: invoice.packingListID.items[i].itemID.description,
                                Quantity: invoice.packingListID.items[i].quantity,
                                Price: invoice.packingListID.items[i].price -
                                    invoice.packingListID.items[i].discount,
                                Cost: averagePrice,
                                Staff: invoice.createdBy.name,
                            });
                        }
                    }
                    else if (invoice.deliverySlipID != null) {
                        for (let i = 0; i < invoice.deliverySlipID.items.length; i++) {
                            const itemID = invoice.deliverySlipID.items[i].itemID;
                            const stockOut = stockouts.filter((stockout) => stockout.invoiceID.toString() === invoiceID &&
                                stockout.itemID.toString() === itemID._id.toString());
                            const stockOutPrice = stockOut.reduce((acc, stockout) => acc + stockout.stockIn.price * stockout.quantity, 0);
                            const averagePrice = stockOutPrice /
                                (invoice.deliverySlipID.items[i].quantity -
                                    invoice.deliverySlipID.items[i].returned);
                            invoicesResult.push({
                                ID: invoice._id,
                                "Invoice Number": invoice.name,
                                Reference: invoice.deliverySlipID.items[i].itemID.reference,
                                Description: invoice.deliverySlipID.items[i].itemID.description,
                                Quantity: invoice.deliverySlipID.items[i].quantity -
                                    invoice.deliverySlipID.items[i].returned,
                                Price: invoice.deliverySlipID.items[i].price -
                                    invoice.deliverySlipID.items[i].discount,
                                COGS: averagePrice,
                            });
                        }
                    }
                });
                return res.status(200).send({
                    bills: billsResult,
                    invoices: invoicesResult,
                });
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on fetching sales product report data ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "Sales report",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user data ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Sales report",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ReportController.fetchPurchaseReport = (req, res) => {
    const month = req.body.month;
    const year = req.body.year;
    good_receipt_model_1.GoodReceiptModelModel.fetchReport(month, year)
        .then((result) => {
        return res.status(200).send({
            data: result.map((x, index) => {
                return {
                    No: index + 1,
                    ID: x._id,
                    "Good Receipt Name": x.name,
                    Date: (0, moment_1.default)(x.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
                    Supplier: x.supplierID == null ? "" : x.supplierID.name,
                    "Created by": x.createdBy.name,
                    Value: x.items.reduce((acc, item) => acc + (item.price - item.discount) * item.quantity, 0),
                    Note: x.note,
                };
            }),
        });
    })
        .catch((error) => {
        console.error(`Error on fetching good receipt report ${error}`);
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ReportController.fetchPurchaseProductReport = (req, res) => {
    const month = req.body.month;
    const year = req.body.year;
    good_receipt_model_1.GoodReceiptModelModel.fetchProductReport(month, year)
        .then((result) => {
        const data = [];
        result.forEach((x) => {
            x.items.forEach((y) => {
                data.push({
                    ID: x._id,
                    "Good Receipt Name": x.name,
                    Date: (0, moment_1.default)(x.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
                    Supplier: x.supplierID == null ? "" : x.supplierID.name,
                    "Created by": x.createdBy.name,
                    Reference: y.itemID.reference,
                    Description: y.itemID.description,
                    Quantity: y.quantity,
                    Price: y.price,
                    Discount: y.discount,
                });
            });
        });
        return res.status(200).send({
            data: data,
        });
    })
        .catch((error) => {
        console.error(`Error on fetching good receipt report ${error}`);
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ReportController.updateSalesReport = (req, res) => {
    const invoices = req.body.invoices;
    const bills = req.body.bills;
    Promise.all([
        invoice_model_1.default.updateReport(invoices),
        bill_model_1.default.updateReport(bills),
    ])
        .then(() => {
        return res.status(200).send({
            invoices: invoices.length,
            bills: bills.length,
        });
    })
        .catch((error) => {
        console.error(`Error on updating sales report ${error}`);
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = ReportController;
//# sourceMappingURL=report.controller.js.map