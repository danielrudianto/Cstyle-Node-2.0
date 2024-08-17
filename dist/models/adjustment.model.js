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
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const stock_model_1 = __importDefault(require("./stock.model"));
const conn = (0, connector_utils_1.connectionFactory)();
class AdjustmentModelModel {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.date = data.date;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.items = data.items;
        this.storeID = data.storeID;
    }
    create() {
        return conn.model("adjustment-event").create({
            date: this.date,
            name: this.name,
            createdBy: this.createdBy,
            createdAt: new Date(),
            items: this.items,
            storeID: this.storeID,
        });
    }
    static fetch(data) {
        const filter = [];
        if (data.status.includes("active")) {
            filter.push({
                isDelete: false,
            });
        }
        if (data.status.includes("deleted")) {
            filter.push({
                isDelete: true,
            });
        }
        return Promise.all([
            conn
                .model("adjustment-event")
                .find({
                $or: filter,
                name: RegExp(data.keyword, "i"),
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$date" }, data.month] },
                        { $eq: [{ $year: "$date" }, data.year] },
                    ],
                },
            })
                .populate("storeID", "name")
                .populate("createdBy", "name")
                .sort({
                createdAt: -1,
            })
                .limit(20)
                .skip(20 * (data.page - 1)),
            conn.model("adjustment-event").countDocuments({
                $or: filter,
                name: RegExp(data.keyword, "i"),
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
            .model("adjustment-event")
            .findById(id)
            .populate("createdBy", "name")
            .populate("deletedBy", "name")
            .populate("storeID", "name")
            .populate("items.itemID", "reference description");
    }
    static deleteByID(id, userID) {
        return conn.model("adjustment-event").findByIdAndUpdate(id, {
            isDelete: true,
            deletedBy: userID,
            deletedAt: new Date(),
        });
    }
    static preCreate(data, storeID) {
        return __awaiter(this, void 0, void 0, function* () {
            const negativeItems = data.filter((x) => x.quantity < 0);
            const result = yield stock_model_1.default.checkStockByItemIDs(negativeItems.map((x) => {
                return {
                    itemID: x.id,
                    quantity: x.quantity * -1,
                };
            }), storeID);
            let validation = true;
            for (let i = 0; i < negativeItems.length; i++) {
                const x = negativeItems[i];
                const stockIndex = result.findIndex((y) => y.itemID.toString() == x.id);
                if (stockIndex == -1 || result[stockIndex].quantity < x.quantity * -1) {
                    validation = false;
                    break;
                }
            }
            return validation;
        });
    }
    static generateName(date) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield conn.model("adjustment-event").countDocuments({
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$date" }, date.getMonth() + 1] },
                            { $eq: [{ $year: "$date" }, date.getFullYear()] },
                        ],
                    },
                });
                return `ADJ-${date.getFullYear()}-${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${(count + 1).toString().padStart(4, "0")}`;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.default = AdjustmentModelModel;
//# sourceMappingURL=adjustment.model.js.map