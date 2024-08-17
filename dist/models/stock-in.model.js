"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class StockInModelModel {
    constructor(data) {
        (this.date = data.date), (this.itemID = data.itemID);
        this.quantity = data.quantity;
        this.residue = data.residue;
        this.price = data.price;
        this.goodReceiptID = data.goodReceiptID;
        this.adjustmentEventID = data.adjustmentEventID;
        this.storeID = data.storeID;
    }
    create() {
        return conn.model("stock-ins").create({
            date: this.date,
            itemID: this.itemID,
            quantity: this.quantity,
            residue: this.residue,
            price: this.price,
            goodReceiptID: this.goodReceiptID,
            adjustmentEventID: this.adjustmentEventID,
            storeID: this.storeID,
        });
    }
    static fetchFifo(itemID) {
        return conn
            .model("stock-ins")
            .findOne({
            itemID: itemID,
            residue: {
                $gt: 0,
            },
        })
            .sort({ date: 1 });
    }
    static fetchDeletation(data) {
        return conn.model("stock-ins").findOne({
            itemID: data.itemID,
            goodReceiptID: data.goodReceiptID,
            adjustmentEventID: data.adjustmentCaseID,
        });
    }
    static updateResidue(stockInID, decr) {
        return conn.model("stock-ins").findByIdAndUpdate(stockInID, {
            $inc: {
                residue: -1 * decr,
            },
        });
    }
    static delete(data) {
        return conn.model("stock-ins").findOneAndDelete({
            goodReceiptID: data.goodReceiptID,
            adjustmentEventID: data.adjustmentEventID,
            itemID: data.itemID,
        });
    }
}
exports.default = StockInModelModel;
//# sourceMappingURL=stock-in.model.js.map