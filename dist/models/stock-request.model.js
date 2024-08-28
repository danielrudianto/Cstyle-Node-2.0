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
class StockRequestModelModel {
    constructor(data) {
        this.name = data.name;
        this.date = data.date;
        this.items = data.items;
        this.note = data.note;
        this.createdBy = data.createdBy;
        this.createdAt = new Date();
        this.requestFrom = data.requestFrom;
        this.requestTo = data.requestTo;
        this.isSending = false;
        this.isConfirm = false;
        this.isReject = false;
        this.isDelete = false;
        this.rejectNote = null;
    }
    create() {
        return conn.model("stock-requests").create({
            name: this.name,
            date: this.date,
            items: this.items,
            note: this.note,
            createdBy: this.createdBy,
            createdAt: new Date(),
            requestFrom: this.requestFrom,
            requestTo: this.requestTo,
            isSending: false,
            isConfirm: false,
            isReject: false,
            isDelete: false,
            rejectNote: null,
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
        if (data.status.includes("sending")) {
            filter.push({
                $and: [
                    {
                        isDelete: false,
                    },
                    {
                        isSending: true,
                    },
                ],
            });
        }
        if (data.status.includes("rejected")) {
            filter.push({
                $and: [
                    {
                        isDelete: false,
                    },
                    {
                        isReject: true,
                    },
                ],
            });
        }
        if (data.status.includes("received")) {
            filter.push({
                $and: [
                    {
                        isDelete: false,
                    },
                    {
                        isConfirm: true,
                    },
                ],
            });
        }
        return Promise.all([
            conn
                .model("stock-requests")
                .find({
                $or: [...filter],
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$createdAt" }, data.month] },
                        { $eq: [{ $year: "$createdAt" }, data.year] },
                    ],
                },
                name: { $regex: RegExp(data.keyword, "i") },
            })
                .populate("requestFrom", "name address")
                .populate("requestTo", "name address")
                .populate("createdBy", "name")
                .skip((data.page - 1) * 10)
                .limit(10)
                .sort({
                createdAt: -1,
            }),
            conn.model("stock-requests").countDocuments({
                $or: [...filter],
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$createdAt" }, data.month] },
                        { $eq: [{ $year: "$createdAt" }, data.year] },
                    ],
                },
                name: { $regex: RegExp(data.keyword, "i") },
            }),
        ]);
    }
    static fetchCreated(page, storeID) {
        return Promise.all([
            conn
                .model("stock-requests")
                .find({
                isDelete: false,
                isSending: false,
                isConfirm: false,
                isReject: false,
                $or: [
                    {
                        requestFrom: storeID,
                    },
                    {
                        requestTo: storeID,
                    },
                ],
            })
                .populate("requestFrom", "name address")
                .populate("requestTo", "name address")
                .populate("createdBy", "name")
                .select("name createdAt requestFrom requestTo createdBy")
                .limit(10)
                .skip((page - 1) * 10)
                .sort({ createdAt: -1 }),
            conn.model("stock-requests").countDocuments({
                isDelete: false,
                isSending: false,
                isConfirm: false,
                isReject: false,
                $or: [
                    {
                        requestFrom: storeID,
                    },
                    {
                        requestTo: storeID,
                    },
                ],
            }),
        ]);
    }
    static fetchByID(id) {
        return conn
            .model("stock-requests")
            .findById(id)
            .populate("createdBy", "name")
            .populate("requestFrom", "name address")
            .populate("requestTo", "name address")
            .populate("sendBy", "name")
            .populate("deletedBy", "name")
            .populate("updatedBy", "name")
            .populate("items.itemID", "reference description");
    }
    static fetchUnsent(page, storeID) {
        return Promise.all([
            conn
                .model("stock-requests")
                .find({
                isDelete: false,
                isSending: false,
                requestTo: storeID,
                isConfirm: false,
                isReject: false,
            })
                .populate("requestFrom", "name address")
                .populate("requestTo", "name address")
                .populate("createdBy", "name")
                .select("_id name createdAt requestFrom requestTo createdBy")
                .limit(10)
                .skip((page - 1) * 10)
                .sort({ createdAt: -1 }),
            conn.model("stock-requests").countDocuments({
                isDelete: false,
                isSending: false,
                requestTo: storeID,
            }),
        ]);
    }
    static fetchUnreceived(page, storeID) {
        return Promise.all([
            conn
                .model("stock-requests")
                .find({
                isDelete: false,
                requestFrom: storeID,
                isSending: true,
                isConfirm: false,
                isReject: false,
            })
                .populate("requestFrom", "name address")
                .populate("requestTo", "name address")
                .populate("createdBy", "name")
                .select("name createdAt requestFrom requestTo createdBy")
                .limit(10)
                .skip((page - 1) * 10)
                .sort({ createdAt: -1 }),
            conn.model("stock-requests").countDocuments({
                isDelete: false,
                requestFrom: storeID,
                isSending: true,
                isConfirm: false,
                isReject: false,
            }),
        ]);
    }
    static send(data) {
        return conn
            .model("stock-requests")
            .findByIdAndUpdate(data.id, {
            items: data.items,
            isSending: true,
            updatedBy: data.createdBy,
            updatedAt: new Date(),
        })
            .populate("requestFrom", "name address")
            .populate("requestTo", "name address")
            .populate("createdBy", "name")
            .populate("sendBy", "name")
            .populate("deletedBy", "name")
            .populate("updatedBy", "name")
            .populate("items.itemID", "reference description");
    }
    static confirmByID(id, userID) {
        return conn.model("stock-requests").findByIdAndUpdate(id, {
            isConfirm: true,
            updatedBy: userID,
            updatedAt: new Date(),
        });
    }
    static rejectByID(id, userID, note) {
        return conn.model("stock-requests").findByIdAndUpdate(id, {
            isReject: true,
            updatedBy: userID,
            updatedAt: new Date(),
            rejectNote: note,
        });
    }
    static deleteByID(id, userID) {
        return conn.model("stock-requests").findByIdAndUpdate(id, {
            isDelete: true,
            deletedBy: userID,
            deletedAt: new Date(),
        });
    }
    static preCreate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield conn.model("stock-requests").countDocuments({
                    $expr: {
                        $and: [
                            {
                                $eq: [{ $month: "$createdAt" }, data.month],
                            },
                            {
                                $eq: [{ $year: "$createdAt" }, data.year],
                            },
                        ],
                    },
                });
                return count;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.default = StockRequestModelModel;
//# sourceMappingURL=stock-request.model.js.map