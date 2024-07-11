import { StockCardInterface } from "../interfaces/stock-card.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class StockCardModelModel {
  id?: string;
  itemID: string;
  quantity: number;
  date: Date;
  billID: string | null;
  invoiceID: string | null;
  adjustmentEventID: string | null;
  goodReceiptID: string | null;
  deliverySlipID: string | null;

  constructor(data: StockCardInterface) {
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

  static deleteByDeliverySlipID(id: string) {
    return conn.model("stock-cards").deleteMany({
      deliverySlipID: id,
    });
  }
}

export default StockCardModelModel;
