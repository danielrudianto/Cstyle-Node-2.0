"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class StockCardModelModel {
    constructor(data) {
        this.itemID = data.itemID;
        this.quantity = data.quantity;
        this.date = data.date;
        this.billID = data.billID;
        this.invoiceID = data.invoiceID;
        this.adjustmentEventID = data.adjustmentEventID;
        this.goodReceiptID = data.goodReceiptID;
        this.deliverySlipID = data.deliverySlipID;
    }
    create() {
        return conn.model("stock-cards").create(this);
    }
    static deleteByDeliverySlipID(id) {
        return conn.model("stock-cards").deleteMany({
            deliverySlipID: id,
        });
    }
}
exports.default = StockCardModelModel;
//# sourceMappingURL=stock-card.model.js.map