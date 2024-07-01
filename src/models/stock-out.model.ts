import { StockOutInterface } from "../interfaces/stock-out.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();
class StockOutModelModel {
  id?: string;
  billID: string | null;
  adjustmentEventID: string | null;
  quantity: number;
  stockInID: string;

  constructor(data: StockOutInterface) {
    if (data.stockInID == undefined) {
      throw new Error("StockInID not found");
    }

    this.id = data.id;
    this.billID = data.billID;
    this.adjustmentEventID = data.adjustmentEventID;
    this.quantity = data.quantity;
    this.stockInID = data.stockInID!;
  }

  create() {
    return conn.model("stock-outs").create({
      billID: this.billID,
      adjustmentEventID: this.adjustmentEventID,
      quantity: this.quantity,
      stockInID: this.stockInID,
    });
  }
}

export default StockOutModelModel;
