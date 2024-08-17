"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class OverflowModelModel {
    constructor(data) {
        this.itemID = data.itemID;
        this.quantity = data.quantity;
        this.billID = data.billID;
        this.adjustmentEventID = data.adjustmentEventID;
        this.invoiceID = data.invoiceID;
    }
    create() {
        return conn.model("overflows").create(this);
    }
    static fetchAll() {
        return conn.model("overflows").find({});
    }
    static deleteByID(id) {
        return conn.model("overflows").findByIdAndDelete(id);
    }
}
exports.default = OverflowModelModel;
//# sourceMappingURL=overflow.model.js.map