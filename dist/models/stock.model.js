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
class StockModelModel {
    constructor(data) {
        this.itemID = data.itemID;
        this.storeID = data.storeID;
        this.quantity = data.quantity;
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield conn.model("stocks").findOneAndUpdate({
                    storeID: this.storeID,
                    itemID: this.itemID,
                }, {
                    $inc: {
                        quantity: this.quantity,
                    },
                }, {
                    upsert: true,
                    new: true,
                    runValidators: true,
                });
            }
            catch (error) {
                throw error;
            }
        });
    }
    static checkStockByItemIDs(items, storeID) {
        return conn.model("stocks").find({
            itemID: { $in: items.map((x) => x.itemID) },
            storeID: storeID,
        });
    }
    static fetchInitial() {
        return conn.model("stocks").find({});
    }
    static checkDashboardStockByItemIDs(items, storeID) {
        return Promise.all([
            conn.model("stocks").aggregate([
                {
                    $match: {
                        itemID: { $in: items.map((x) => x.itemID) },
                        storeID: storeID,
                    },
                },
                {
                    $group: {
                        _id: "$itemID",
                        quantity: { $sum: "$quantity" },
                    },
                },
            ]),
            conn.model("stocks").aggregate([
                {
                    $match: {
                        itemID: { $in: items.map((x) => x.itemID) },
                        storeID: {
                            $ne: storeID,
                        },
                    },
                },
                {
                    $group: {
                        _id: "$itemID",
                        quantity: { $sum: "$quantity" },
                    },
                },
            ]),
        ]);
    }
    static fetch(storeID, itemIDs) {
        return Promise.all([]);
    }
    static fetchByStoreID(storeID) {
        return conn.model("stocks").find({
            storeID: storeID,
            quantity: {
                $gt: 0,
            },
        });
    }
    static fetchCashier(data) {
        return conn.model("stocks").aggregate([
            {
                $match: {
                    itemID: { $in: data },
                },
            },
            {
                $group: {
                    _id: {
                        storeID: "$storeID",
                        itemID: "$itemID",
                    },
                    quantity: { $sum: "$quantity" },
                },
            },
        ]);
    }
    static fetchByItemID(itemID) {
        return conn
            .model("stocks")
            .find({
            itemID: itemID,
        })
            .populate("storeID", "name address");
    }
    static removeStockIn(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield conn.model("stock-ins").findOneAndDelete({
                itemID: data.itemID,
                goodReceiptID: data.goodReceiptID,
                adjustmentCaseID: data.adjustmentCaseID,
            });
            const stockIn = result;
            const stockInID = stockIn._id;
            const stockOuts = yield conn.model("stock-outs").find({
                stockInID: stockInID,
            });
            for (let i = 0; i < stockOuts.length; i++) {
                yield conn.model("overflows").create({
                    quantity: stockOuts[i].quantity,
                    billID: stockOuts[i].billID,
                    invoiceID: stockOuts[i].invoiceID,
                    adjustmentEventID: stockOuts[i].adjustmentEventID,
                    itemID: stockOuts[i].itemID,
                });
                yield conn.model("stock-outs").deleteOne({
                    _id: stockOuts[i]._id,
                });
            }
            return true;
        });
    }
}
exports.default = StockModelModel;
//# sourceMappingURL=stock.model.js.map