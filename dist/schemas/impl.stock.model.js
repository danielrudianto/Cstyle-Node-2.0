"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
class Stock {
    constructor(itemID, storeID, quantity) {
        this.itemID = itemID;
        this.storeID = storeID;
        this.quantity = quantity;
    }
}
const StockSchema = new mongoose_1.Schema({
    itemID: { type: mongoose_1.Types.ObjectId, required: true, ref: "items" },
    storeID: { type: mongoose_1.Types.ObjectId, required: false, ref: "stores" },
    quantity: { type: Number, required: true },
});
exports.default = StockSchema;
//# sourceMappingURL=impl.stock.model.js.map