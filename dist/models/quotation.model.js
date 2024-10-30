"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quotation_interface_1 = require("../interfaces/quotation.interface");
const moment_1 = __importDefault(require("moment"));
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class QuotationModelModel {
    constructor(data) {
        this.date = data.date;
        this.expiryDate = data.expiryDate;
        this.name = data.name;
        this.customerID = data.customerID;
        this.note = data.note;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.items = data.items;
    }
    create() {
        return conn.model("quotations").create({
            date: this.date,
            expiryDate: this.expiryDate,
            name: this.name,
            customerID: this.customerID,
            note: this.note,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            items: this.items,
        });
    }
    static search(data) {
        const filters = [];
        if (data.status.includes(quotation_interface_1.QuotationStatus.Active)) {
            filters.push({
                isDelete: false,
                expiryDate: { $gte: (0, moment_1.default)(new Date()).format("YYYY-MM-DD") },
            });
        }
        if (data.status.includes(quotation_interface_1.QuotationStatus.Expired)) {
            filters.push({
                isDelete: false,
                expiryDate: { $lt: (0, moment_1.default)(new Date()).format("YYYY-MM-DD") },
            });
        }
        if (data.status.includes(quotation_interface_1.QuotationStatus.Canceled)) {
            filters.push({
                isDelete: true,
            });
        }
        return Promise.all([
            conn
                .model("quotations")
                .find({
                name: {
                    $regex: new RegExp(data.keyword, "i"),
                },
                $or: filters,
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, data.month] },
                        { $eq: [{ $year: "$date" }, data.year] },
                    ],
                },
            })
                .sort({ date: 1 })
                .select("date name expiryDate createdAt isDelete")
                .populate("customerID", "name")
                .populate("createdBy", "name")
                .populate("deletedBy", "name")
                .limit(20)
                .skip((data.page - 1) * 20),
            conn.model("quotations").countDocuments({
                name: {
                    $regex: new RegExp(data.keyword, "i"),
                },
                $or: filters,
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, data.month] },
                        { $eq: [{ $year: "$date" }, data.year] },
                    ],
                },
            }),
        ]);
    }
    static fetchByID(id) {
        return conn
            .model("quotations")
            .findById(id)
            .populate("customerID")
            .populate("items.itemID", "reference description")
            .populate("createdBy", "name")
            .populate("deletedBy", "name");
    }
    static countDocumentByMonthYear(month, year) {
        return conn.model("quotations").countDocuments({
            $expr: {
                $and: [
                    { $eq: [{ $month: "$date" }, month] },
                    { $eq: [{ $year: "$date" }, year] },
                ],
            },
        });
    }
    static deleteByID(id, userID) {
        return conn.model("quotations").findByIdAndUpdate(id, {
            isDelete: true,
            deletedBy: userID,
            deletedAt: new Date(),
        });
    }
}
exports.default = QuotationModelModel;
//# sourceMappingURL=quotation.model.js.map