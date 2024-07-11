import { OverflowInterface } from "../interfaces/overflow.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class OverflowModelModel {
  itemID: string;
  quantity: number;
  billID: string | null;
  adjustmentEventID: string | null;
  invoiceID: string | null;

  constructor(data: OverflowInterface) {
    this.itemID = data.itemID;
    this.quantity = data.quantity;
    this.billID = data.billID;
    this.adjustmentEventID = data.adjustmentEventID;
    this.invoiceID = data.invoiceID;
  }

  create() {
    return conn.model("overflow").create(this);
  }

  static fetchAll() {
    return conn.model("overflow").find({});
  }
}

export default OverflowModelModel;
