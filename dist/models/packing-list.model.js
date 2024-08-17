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
const packing_list_interface_1 = require("../interfaces/packing-list.interface");
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class PackingListModelModel {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.date = data.date;
        this.note = data.note;
        this.customerID = data.customerID;
        this.salesID = data.salesID;
        this.items = data.items;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
    }
    create() {
        return conn.model("packing-list").create({
            name: this.name,
            date: this.date,
            note: this.note,
            customerID: this.customerID,
            salesID: this.salesID,
            items: this.items,
            createdBy: this.createdBy,
            createdAt: new Date(),
        });
    }
    static fetch(data) {
        const filters = [];
        if (data.status.includes(packing_list_interface_1.PackingListStatus.Active)) {
            filters.push({
                isDelete: false,
            });
        }
        if (data.status.includes(packing_list_interface_1.PackingListStatus.Deleted)) {
            filters.push({
                isDelete: true,
            });
        }
        return Promise.all([
            conn
                .model("packing-list")
                .find({
                $or: filters,
                name: { $regex: data.keyword, $options: "i" },
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, data.month] },
                        { $eq: [{ $year: "$date" }, data.year] },
                    ],
                },
            })
                .sort({ date: 1 })
                .populate("customerID")
                .populate("salesID", "name")
                .populate("createdBy", "name")
                .populate("deletedBy", "name")
                .limit(20)
                .skip((data.page - 1) * 20),
            conn.model("packing-list").countDocuments({
                $or: filters,
                name: { $regex: data.keyword, $options: "i" },
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
            .model("packing-list")
            .findById(id)
            .populate("items.itemID")
            .populate("customerID", "name address phoneNumber")
            .populate("salesID", "name");
    }
    static deleteByID(id, userID) {
        return conn.model("packing-list").findByIdAndUpdate(id, {
            isDelete: true,
            deletedBy: userID,
            deletedAt: new Date(),
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
    static generateName(date) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("packing-list").countDocuments({
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, date.getMonth() + 1] },
                        { $eq: [{ $year: "$date" }, date.getFullYear()] },
                    ],
                },
            });
            return ("PL-CS-" +
                date.getFullYear() +
                "-" +
                (date.getMonth() + 1).toString().padStart(2, "0") +
                "-" +
                (count + 1).toString().padStart(4, "0"));
        });
    }
}
exports.default = PackingListModelModel;
//# sourceMappingURL=packing-list.model.js.map