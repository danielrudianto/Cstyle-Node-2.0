"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class StockOutModelModel {
    constructor(data) {
        if (data.stockInID == undefined) {
            throw new Error("StockInID not found");
        }
        this.id = data.id;
        this.itemID = data.itemID;
        this.billID = data.billID;
        this.adjustmentEventID = data.adjustmentEventID;
        this.quantity = data.quantity;
        this.stockInID = data.stockInID;
        this.invoiceID = data.invoiceID;
        this.date = data.date;
    }
    create() {
        return conn.model("stock-outs").create({
            date: this.date,
            itemID: this.itemID,
            billID: this.billID,
            adjustmentEventID: this.adjustmentEventID,
            invoiceID: this.invoiceID,
            quantity: this.quantity,
            stockInID: this.stockInID,
        });
    }
    static fetchByStockInID(stockInID) {
        return conn.model("stock-outs").find({ stockInID: stockInID });
    }
    static fetchDeletation(data) {
        return conn.model("stock-outs").aggregate([
            {
                $lookup: {
                    from: "stock-ins",
                    localField: "stockInID",
                    foreignField: "_id",
                    as: "stockIn",
                },
            },
            {
                $unwind: {
                    path: "$stockIn",
                },
            },
            {
                $match: {
                    billID: data.billID == null ? null : new mongoose_1.Types.ObjectId(data.billID),
                    invoiceID: data.invoiceID == null ? null : new mongoose_1.Types.ObjectId(data.invoiceID),
                    adjustmentEventID: data.adjustmentCaseID == null
                        ? null
                        : new mongoose_1.Types.ObjectId(data.adjustmentCaseID),
                    "stockIn.itemID": new mongoose_1.Types.ObjectId(data.itemID),
                },
            },
        ]);
    }
    static fetchProductReport(month, year) {
        return conn.model("stock-outs").aggregate([
            {
                $match: {
                    $and: [
                        {
                            date: {
                                $gte: new Date(year, month - 1, 1),
                            },
                        },
                        {
                            date: {
                                $lt: new Date(year, month, 1),
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "stock-ins",
                    localField: "stockInID",
                    foreignField: "_id",
                    as: "stockIn",
                },
            },
            {
                $unwind: {
                    path: "$stockIn",
                },
            },
        ]);
    }
    static deleteByID(id) {
        return conn.model("stock-outs").findByIdAndDelete(id);
    }
}
exports.default = StockOutModelModel;
//# sourceMappingURL=stock-out.model.js.map