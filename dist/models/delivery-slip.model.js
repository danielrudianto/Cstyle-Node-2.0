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
const delivery_slip_interface_1 = require("../interfaces/delivery-slip.interface");
const conn = (0, connector_utils_1.connectionFactory)();
class DeliverySlipModelModel {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.date = data.date;
        this.customerID = data.customerID;
        this.salesID = data.salesID;
        this.items = data.items;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.deletedBy = data.deletedBy;
        this.deletedAt = data.deletedAt;
        this.isDelete = data.isDelete;
        this.isReturn = data.isReturn;
        this.returnedAt = data.returnedAt;
    }
    create() {
        return conn.model("delivery-slip").create({
            name: this.name,
            date: this.date,
            customerID: this.customerID,
            salesID: this.salesID,
            items: this.items,
            createdBy: this.createdBy,
            createdAt: new Date(),
        });
    }
    static fetch(data) {
        const filter = [];
        if (data.status.includes(delivery_slip_interface_1.DeliverySlipFetchStatus.active)) {
            filter.push({
                $expr: {
                    $and: [{ $eq: ["$isDelete", false] }, { $eq: ["$isReturn", false] }],
                },
            });
        }
        if (data.status.includes(delivery_slip_interface_1.DeliverySlipFetchStatus.returned)) {
            filter.push({
                $expr: {
                    $and: [{ $eq: ["$isDelete", false] }, { $eq: ["$isReturn", true] }],
                },
            });
        }
        if (data.status.includes(delivery_slip_interface_1.DeliverySlipFetchStatus.canceled)) {
            filter.push({
                $expr: {
                    $and: [{ $eq: ["$isDelete", true] }, { $eq: ["$deletedBy", null] }],
                },
            });
        }
        return Promise.all([
            conn
                .model("delivery-slip")
                .find({
                $or: filter,
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, data.month] },
                        { $eq: [{ $year: "$date" }, data.year] },
                    ],
                },
                name: RegExp(data.keyword, "i"),
            })
                .populate("customerID", "name")
                .populate("salesID", "name")
                .populate("createdBy", "name")
                .skip((data.page - 1) * 10)
                .limit(10),
            conn.model("delivery-slip").countDocuments({
                $or: filter,
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, data.month] },
                        { $eq: [{ $year: "$date" }, data.year] },
                    ],
                },
                name: RegExp(data.keyword, "i"),
            }),
        ]);
    }
    static fetchByID(id) {
        return conn
            .model("delivery-slip")
            .findById(id)
            .populate("customerID", "name")
            .populate("salesID", "name")
            .populate("items.itemID", "reference description");
    }
    static fetchUnconfirmed(page) {
        return Promise.all([
            conn
                .model("delivery-slip")
                .find({ isReturn: false, isDelete: false })
                .populate("customerID", "name")
                .skip((page - 1) * 10)
                .limit(10),
            conn.model("delivery-slip").countDocuments({ deletedBy: null }),
        ]);
    }
    static update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const deliverySlip = yield conn.model("delivery-slips").findById(data.id);
            deliverySlip.isReturn = true;
            deliverySlip.returnedAt = new Date();
            for (let i = 0; i < data.items.length; i++) {
                const id = data.items[i].id;
                const quantity = data.items[i].return;
                const index = deliverySlip.items.findIndex((x) => x.id == id);
                if (index != -1) {
                    deliverySlip.items[index].returned = quantity;
                }
            }
            yield deliverySlip.save();
            return deliverySlip;
        });
    }
    static deleteByID(id, userID) {
        return conn.model("delivery-slip").findByIdAndUpdate(id, {
            isDelete: true,
            deletedBy: userID,
            deletedAt: new Date(),
        });
    }
    static generateName(date) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("delivery-slip").countDocuments({
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, date.getMonth() + 1] },
                        { $eq: [{ $year: "$date" }, date.getFullYear()] },
                    ],
                },
            });
            return ("DS-CS-" +
                date.getFullYear() +
                "-" +
                (date.getMonth() + 1).toString().padStart(2, "0") +
                "-" +
                (count + 1).toString().padStart(4, "0"));
        });
    }
    static preCreate(items) {
        const modifiedItems = [];
        for (let i = 0; i < items.length; i++) {
            if (modifiedItems.filter((x) => x.itemID == items[i].itemID &&
                x.price == items[i].price &&
                x.discount == items[i].discount).length == 0) {
                modifiedItems.push(items[i]);
            }
            else {
                modifiedItems[modifiedItems.findIndex((x) => x.itemID == items[i].itemID &&
                    x.price == items[i].price &&
                    x.discount == items[i].discount)].quantity += items[i].quantity;
            }
        }
        return modifiedItems;
    }
}
exports.default = DeliverySlipModelModel;
//# sourceMappingURL=delivery-slip.model.js.map