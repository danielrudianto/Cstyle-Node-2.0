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
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class InvoiceModelModel {
    constructor(data) {
        this.name = data.name;
        this.date = data.date;
        this.note = data.note;
        this.dueDate = data.dueDate;
        this.packingListID = data.packingListID;
        this.deliverySlipID = data.deliverySlipID;
        this.createdBy = data.createdBy;
        this.customerID = data.customerID;
        this.salesID = data.salesID;
        this.isHidden = data.isHidden;
        this.isDelete = data.isDelete;
        this.deletedBy = data.deletedBy;
        this.deletedAt = data.deletedAt;
    }
    create() {
        return conn.model("invoices").create({
            name: this.name,
            date: this.date,
            note: this.note,
            dueDate: this.dueDate,
            packingListID: this.packingListID,
            deliverySlipID: this.deliverySlipID,
            createdBy: this.createdBy,
            createdAt: new Date(),
            customerID: this.customerID,
            salesID: this.salesID,
        });
    }
    static fetch(data) {
        const filters = [];
        const paymentFilters = [];
        if (data.status.includes("active")) {
            filters.push({
                isDelete: false,
            });
        }
        if (data.status.includes("deleted")) {
            filters.push({
                isDelete: true,
            });
        }
        if (data.paymentStatus.includes("paid")) {
            paymentFilters.push({
                isPaid: true,
            });
        }
        if (data.paymentStatus.includes("unpaid")) {
            paymentFilters.push({
                isPaid: false,
            });
        }
        console.log(data.keyword);
        console.log(data.month);
        console.log(data.year);
        console.log(paymentFilters);
        console.log(filters);
        return Promise.all([
            conn
                .model("invoices")
                .find({
                $and: [
                    {
                        $or: filters,
                    },
                    {
                        $or: paymentFilters,
                    },
                ],
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, data.month] },
                        { $eq: [{ $year: "$date" }, data.year] },
                    ],
                },
            })
                .populate("customerID", "name")
                .populate("salesID", "name")
                .populate("createdBy", "name")
                .sort({
                date: 1,
            })
                .limit(20)
                .skip(20 * (data.page - 1)),
            conn.model("invoices").countDocuments({
                $and: [
                    {
                        $or: filters,
                    },
                    {
                        $or: paymentFilters,
                    },
                ],
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, data.month] },
                        { $eq: [{ $year: "$date" }, data.year] },
                    ],
                },
            }),
        ]);
    }
    static fetchReport(month, year, shownOnly = true) {
        let query = {
            $expr: {
                $and: [
                    { $eq: [{ $month: "$date" }, month] },
                    { $eq: [{ $year: "$date" }, year] },
                ],
            },
        };
        if (shownOnly) {
            query.isHidden = false;
        }
        return conn
            .model("invoices")
            .find(query)
            .populate("customerID", "name")
            .populate("salesID", "name")
            .populate("createdBy", "name")
            .populate("packingListID");
    }
    static fetchProductReport(month, year, shownOnly = true) {
        if (shownOnly) {
            return conn
                .model("invoices")
                .find({
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, month] },
                        { $eq: [{ $year: "$date" }, year] },
                    ],
                },
                isHidden: false,
            })
                .populate({
                path: "packingListID",
                populate: {
                    path: "items.itemID",
                    model: "items",
                    select: "reference description _id",
                },
            })
                .populate({
                path: "deliverySlipID",
                populate: {
                    path: "items.itemID",
                    model: "items",
                    select: "reference description _id",
                },
            })
                .populate("packingListID.customerID", "name")
                .populate("deliverySlipID.customerID", "name");
        }
        else {
            return conn
                .model("invoices")
                .find({
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, month] },
                        { $eq: [{ $year: "$date" }, year] },
                    ],
                },
            })
                .populate({
                path: "packingListID",
                populate: {
                    path: "items.itemID",
                    model: "items",
                    select: "reference description _id",
                },
            })
                .populate({
                path: "deliverySlipID",
                populate: {
                    path: "items.itemID",
                    model: "items",
                    select: "reference description _id",
                },
            })
                .populate("packingListID.customerID", "name")
                .populate("deliverySlipID.customerID", "name");
        }
    }
    static fetchByID(id) {
        return conn
            .model("invoices")
            .findById(id)
            .populate("customerID", "name address phoneNumber")
            .populate("salesID", "name")
            .populate("createdBy", "name")
            .populate("packingListID")
            .populate("deliverySlipID");
    }
    static fetchByPackingListID(id) {
        return conn.model("invoices").findOne({
            packingListID: id,
        });
    }
    static fetchByDeliverySlipID(id) {
        return conn.model("invoices").findOne({
            deliverySlipID: id,
        });
    }
    static updatePayment(data) {
        return conn.model("invoices").findByIdAndUpdate(data.id, {
            payments: [
                {
                    paidAt: data.paidAt,
                    paidBy: data.paidBy,
                    paymentMethod: data.paymentMethod,
                    amount: data.amount,
                },
            ],
            isPaid: true,
        });
    }
    static updateReport(data) {
        return Promise.all(data.map((item) => conn.model("invoices").findByIdAndUpdate(item.id, {
            isHidden: item.isHidden,
        })));
    }
    static deleteByID(id, userID) {
        return conn.model("invoices").findByIdAndUpdate(id, {
            isDelete: true,
            deletedBy: userID,
            deletedAt: new Date(),
        });
    }
    static deletePaymentByID(id) {
        return conn.model("invoices").findByIdAndUpdate(id, {
            isPaid: false,
            payments: [],
        });
    }
    static generateName(date) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("invoices").countDocuments({
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, date.getMonth() + 1] },
                        { $eq: [{ $year: "$date" }, date.getFullYear()] },
                    ],
                },
            });
            return ("INV-CS-" +
                date.getFullYear() +
                "-" +
                (date.getMonth() + 1).toString().padStart(2, "0") +
                "-" +
                (count + 1).toString().padStart(4, "0"));
        });
    }
}
exports.default = InvoiceModelModel;
//# sourceMappingURL=invoice.model.js.map