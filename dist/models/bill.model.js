"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class BillModelModel {
    constructor(data) {
        this._id = data._id;
        this.name = data.name;
        this.date = data.date;
        this.memberID = data.memberID;
        this.storeID = data.storeID;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.items = data.items;
        this.payment = data.payment;
    }
    static insertMany(data) {
        return conn.model("bills").insertMany(data);
    }
    static fetch(data) {
        if (data.isOwner) {
            return Promise.all([
                conn
                    .model("bills")
                    .find({
                    isHidden: false,
                    name: RegExp(data.keyword, "i"),
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$date" }, data.month + 1] },
                            { $eq: [{ $year: "$date" }, data.year] },
                        ],
                    },
                })
                    .sort({
                    date: 1,
                })
                    .populate("createdBy", "name")
                    .populate("memberID", "code name")
                    .populate("storeID", "name")
                    .limit(20)
                    .skip((data.page - 1) * 20),
                conn.model("bills").countDocuments({
                    isHidden: false,
                    name: RegExp(data.keyword, "i"),
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$date" }, data.month + 1] },
                            { $eq: [{ $year: "$date" }, data.year] },
                        ],
                    },
                }),
            ]);
        }
        else {
            return Promise.all([
                conn
                    .model("bills")
                    .find({
                    name: RegExp(data.keyword, "i"),
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$date" }, data.month + 1] },
                            { $eq: [{ $year: "$date" }, data.year] },
                        ],
                    },
                })
                    .sort({
                    date: 1,
                })
                    .populate("createdBy", "name")
                    .populate("memberID", "code name")
                    .populate("storeID", "name")
                    .limit(20)
                    .skip((data.page - 1) * 20),
                conn.model("bills").countDocuments({
                    name: RegExp(data.keyword, "i"),
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$date" }, data.month + 1] },
                            { $eq: [{ $year: "$date" }, data.year] },
                        ],
                    },
                }),
            ]);
        }
    }
    static fetchStore(data) {
        const page = data.page;
        const storeID = data.storeID;
        return Promise.all([
            conn
                .model("bills")
                .find({
                storeID: storeID,
                isDelete: false,
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            })
                .sort({
                date: -1,
            })
                .populate("createdBy", "name")
                .populate("memberID", "code name")
                .limit(20)
                .skip((page - 1) * 20),
            conn.model("bills").countDocuments({
                storeID: storeID,
                isDelete: false,
            }),
        ]);
    }
    static fetchByID(id) {
        return conn
            .model("bills")
            .findById(id)
            .populate("memberID", "code name")
            .populate("createdBy", "name")
            .populate("items.itemID", "reference description");
    }
    static fetchStatus() {
        const todayDate = new Date();
        const weekDate = new Date();
        const biweekDate = new Date();
        const monthDate = new Date();
        weekDate.setDate(todayDate.getDate() - 7);
        biweekDate.setDate(todayDate.getDate() - 14);
        monthDate.setDate(todayDate.getDate() - 300);
        return Promise.all([
            conn.model("bills").aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(todayDate),
                        },
                        isDelete: false,
                    },
                },
                {
                    $unwind: "$items",
                },
                {
                    $group: {
                        _id: null,
                        value: {
                            $sum: {
                                $multiply: [
                                    { $subtract: ["$items.price", "$items.discount"] },
                                    "$items.quantity",
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        value: "$value",
                    },
                },
            ]),
            conn.model("bills").aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(todayDate),
                        },
                        isDelete: false,
                    },
                },
                {
                    $unwind: "$items",
                },
                {
                    $group: {
                        _id: null,
                        value: {
                            $sum: {
                                $multiply: [
                                    { $subtract: ["$items.price", "$items.discount"] },
                                    "$items.quantity",
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        value: "$value",
                    },
                },
            ]),
            conn.model("bills").aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(biweekDate),
                        },
                        isDelete: false,
                    },
                },
                {
                    $unwind: "$items",
                },
                {
                    $group: {
                        _id: null,
                        value: {
                            $sum: {
                                $multiply: [
                                    { $subtract: ["$items.price", "$items.discount"] },
                                    "$items.quantity",
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        value: "$value",
                    },
                },
            ]),
            conn.model("bills").aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(monthDate),
                        },
                        isDelete: false,
                    },
                },
                {
                    $unwind: "$items",
                },
                {
                    $group: {
                        _id: null,
                        value: {
                            $sum: {
                                $multiply: [
                                    { $subtract: ["$items.price", "$items.discount"] },
                                    "$items.quantity",
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        value: "$value",
                    },
                },
            ]),
        ]);
    }
    static fetchReport(storeID, month, year, shownOnly = true) {
        let query = {
            $expr: {
                $and: [
                    { $eq: [{ $year: "$date" }, year] },
                    { $eq: [{ $month: "$date" }, month] },
                ],
            },
        };
        if (shownOnly) {
            query.isHidden = false;
        }
        if (storeID) {
            query.storeID = storeID;
        }
        return conn
            .model("bills")
            .find(query)
            .populate("createdBy", "name")
            .populate("memberID", "code")
            .populate("storeID", "name");
    }
    static fetchStoreReport(storeID) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        console.log(storeID);
        return conn.model("bills").find({
            storeID: storeID,
            isDelete: false,
            $and: [
                {
                    date: {
                        $gte: date,
                    },
                },
                {
                    date: {
                        $lte: new Date(),
                    },
                },
            ],
        });
    }
    static fetchProductReport(storeID, month, year, shownOnly = true) {
        let query = {
            $expr: {
                $and: [
                    { $eq: [{ $year: "$date" }, year] },
                    { $eq: [{ $month: "$date" }, month] },
                ],
            },
        };
        if (storeID) {
            query.storeID = storeID;
        }
        if (shownOnly) {
            query.isHidden = false;
        }
        return conn
            .model("bills")
            .find(query)
            .populate("items.itemID", "reference description")
            .populate("storeID", "name")
            .populate("memberID", "code");
    }
    static fetchMemberTransactions() {
        return conn.model("bills").countDocuments({
            memberID: {
                $ne: null,
            },
            isDelete: false,
            date: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
        });
    }
    static countBills(storeID, period) {
        return Promise.all([
            period == -1
                ? conn.model("bills").countDocuments({
                    isDelete: false,
                    storeID: storeID,
                })
                : conn.model("bills").countDocuments({
                    isDelete: false,
                    storeID: storeID,
                    date: {
                        $gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000),
                    },
                }),
            conn.model("bills").aggregate([
                period == -1
                    ? {
                        $match: {
                            storeID: storeID,
                            isDelete: false,
                        },
                    }
                    : {
                        $match: {
                            storeID: storeID,
                            isDelete: false,
                            date: {
                                $gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000),
                            },
                        },
                    },
                {
                    $unwind: "$items",
                },
                {
                    $group: {
                        _id: null,
                        value: {
                            $sum: {
                                $multiply: [
                                    { $subtract: ["$items.price", "$items.discount"] },
                                    "$items.quantity",
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        value: "$value",
                    },
                },
            ]),
        ]);
    }
    static updateReport(data) {
        return Promise.all(data.map((item) => conn.model("bills").findByIdAndUpdate(item.id, {
            isHidden: item.isHidden,
        })));
    }
    static deleteByID(data) {
        return conn.model("bills").findByIdAndUpdate(data.id, {
            isDelete: true,
            deletedBy: data.userID,
            deletedAt: new Date(),
        });
    }
}
exports.default = BillModelModel;
//# sourceMappingURL=bill.model.js.map