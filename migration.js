// import mongoose
const mongoose = require("mongoose");

// connect to the database
mongoose.connect("mongodb://127.0.0.1:27017/Cstyle", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// get the connection
const db = mongoose.connection;

// check if the connection is successful
db.on("error", console.error.bind(console, "connection error:"));

// once the connection is open
db.once("open", function () {
  console.log("Successfully connected to the database");
});

const goodReceiptItemsSchema = new mongoose.Schema({
  itemID: mongoose.Schema.Types.ObjectId,
  quantity: Number,
  price: Number,
  discount: Number,
});

const goodReceiptSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  supplierID: String,
  date: Date,
  note: String,
  createdAt: Date,
  createdBy: mongoose.Schema.Types.ObjectId,
  isDelete: Boolean,
  isInvoiced: Boolean,
  items: [goodReceiptItemsSchema],
});

const GoodReceipt = mongoose.model("good-receipts", goodReceiptSchema);

const adjustmentEventItemsSchema = new mongoose.Schema({
  itemID: mongoose.Schema.Types.ObjectId,
  quantity: Number,
});

const adjustmentEventSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  date: Date,
  note: String,
  items: [adjustmentEventItemsSchema],
});

const AdjustmentEvent = mongoose.model(
  "adjustment-events",
  adjustmentEventSchema
);

const stockInSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  itemID: mongoose.Schema.Types.ObjectId,
  quantity: Number,
  price: Number,
  date: Date,
  goodReceiptID: mongoose.Schema.Types.ObjectId,
  adjustmentEventID: mongoose.Schema.Types.ObjectId,
  residue: Number,
});

const StockIn = mongoose.model("stock-ins", stockInSchema);

const billItemSchema = new mongoose.Schema({
  itemID: mongoose.Schema.Types.ObjectId,
  quantity: Number,
  price: Number,
  discount: Number,
});

const billSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  date: Date,
  items: [billItemSchema],
});

const Bill = mongoose.model("bills", billSchema);

const PackingListItemSchema = new mongoose.Schema({
  itemID: { type: mongoose.Types.ObjectId, required: true, ref: "items" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, required: true },
});

const PackingListSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  customerID: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "customer",
  },
  date: { type: Date, required: true },
  items: [PackingListItemSchema],
  createdBy: { type: mongoose.Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: new Date() },
  isDelete: { type: Boolean, required: true, default: false },
  deletedBy: {
    type: mongoose.Types.ObjectId,
    required: false,
    ref: "users",
    default: null,
  },
  deletedAt: { type: Date, required: false, default: null },
  salesID: { type: mongoose.Types.ObjectId, required: false, ref: "users" },
  note: { type: String, required: false, default: "" },
});

const PackingList = mongoose.model("packing-lists", PackingListSchema);

const InvoicePaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["cash", "transfer"],
  },
  paidAt: { type: Date, required: true },
  paidBy: { type: mongoose.Types.ObjectId, required: true, ref: "users" },
});

const InvoiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  packingListID: {
    type: mongoose.Types.ObjectId,
    required: false,
    ref: "packing-lists",
  },
  deliverySlipID: {
    type: mongoose.Types.ObjectId,
    required: false,
    ref: "delivery-slips",
  },
  customerID: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "customer",
  },
  salesID: { type: mongoose.Types.ObjectId, required: false, ref: "users" },
  date: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  createdBy: { type: mongoose.Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true },
  note: { type: String, required: false },
  isHidden: { type: Boolean, required: true, default: false },
  isPaid: { type: Boolean, required: true, default: false },
  payments: { type: [InvoicePaymentSchema], required: true },
  isDelete: { type: Boolean, required: true, default: false },
  deletedAt: { type: Date, required: false },
  deletedBy: { type: mongoose.Types.ObjectId, required: false, ref: "users" },
});

const Invoice = mongoose.model("invoices", InvoiceSchema);

const StockOutSchema = new mongoose.Schema({
  itemID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  billID: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "bills",
  },
  adjustmentEventID: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "adjustment-events",
  },
  invoiceID: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "invoices",
  },
  stockInID: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "stock-ins",
  },
});

const StockOut = mongoose.model("stock-outs", StockOutSchema);

const OverflowSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
  },
  billID: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "bills",
  },
  adjustmentEventID: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "adjustment-events",
  },
  invoiceID: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "invoices",
  },
  itemID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "items",
  },
});

const Overflow = mongoose.model("overflows", OverflowSchema);

// First we have to get all the good receipts and adjustment events, sorted by date
Promise.all([
  GoodReceipt.find({
    isDelete: false,
  }).sort({ date: 1 }),
  AdjustmentEvent.find({
    isDelete: false,
  }).sort({ date: 1 }),
  Bill.find({
    isDelete: false,
  }).sort({ date: 1 }),
  Invoice.find({
    isDelete: false,
  })
    .sort({ date: 1 })
    .populate("packingListID"),
]).then(async ([goodReceipts, adjustmentEvents, bills, invoices]) => {
  const stockInToBeInserted = [];
  const stockOutTobeUpdated = [];

  for (let i = 0; i < goodReceipts.length; i++) {
    const goodReceipt = goodReceipts[i];
    const items = goodReceipt.items;

    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      const stockIn = {
        itemID: item.itemID,
        quantity: item.quantity,
        price: item.price,
        date: goodReceipt.date,
        goodReceiptID: goodReceipt._id,
        residue: item.quantity,
      };

      stockInToBeInserted.push(stockIn);
    }
  }

  for (let i = 0; i < adjustmentEvents.length; i++) {
    const adjustmentEvent = adjustmentEvents[i];
    const items = adjustmentEvent.items;

    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      if (item.quantity > 0) {
        const stockIn = {
          itemID: item.itemID,
          quantity: item.quantity,
          price: 0,
          date: adjustmentEvent.date,
          adjustmentEventID: adjustmentEvent._id,
          residue: item.quantity,
        };

        stockInToBeInserted.push(stockIn);
      } else {
        const stockOut = {
          itemID: item.itemID,
          quantity: -item.quantity,
          price: 0,
          date: adjustmentEvent.date,
          billID: null,
          invoiceID: null,
          adjustmentEventID: adjustmentEvent._id,
        };

        stockOutTobeUpdated.push(stockOut);
      }
    }
  }

  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i];
    const items = bill.items;
    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      const stockOut = {
        itemID: item.itemID,
        quantity: item.quantity,
        price: item.price - item.discount,
        date: bill.date,
        billID: bill._id,
        invoiceID: null,
        adjustmentEventID: null,
      };

      stockOutTobeUpdated.push(stockOut);
    }
  }

  for (let i = 0; i < invoices.length; i++) {
    const invoice = invoices[i];
    const items = invoice.packingListID.items;

    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      const stockOut = {
        itemID: item.itemID,
        quantity: item.quantity,
        price: item.price - item.discount,
        date: invoice.date,
        billID: null,
        invoiceID: invoice._id,
        adjustmentEventID: null,
      };

      stockOutTobeUpdated.push(stockOut);
    }
  }

  // sort the stockOutTobeUpdated by date asc
  stockOutTobeUpdated.sort((a, b) => a.date - b.date);

  StockIn.insertMany(stockInToBeInserted).then(async () => {
    for (let i = 0; i < stockOutTobeUpdated.length; i++) {
      const stockOut = stockOutTobeUpdated[i];
      let q = stockOut.quantity ?? 0;

      try {
        while (q > 0) {
          // Find the stock in with residue > 0
          const stockIn = await StockIn.findOne(
            {
              itemID: stockOut.itemID,
              residue: { $gt: 0 },
            },
            null,
            {
              sort: { date: 1 },
            }
          );

          if (stockIn) {
            console.log(`Quantity value: ${q}`);
            // Update the stock in
            if (stockIn.residue >= q) {
              await StockIn.updateOne(
                { _id: stockIn._id },
                { $inc: { residue: -q } }
              );

              await StockOut.create({
                itemID: stockOut.itemID,
                quantity: 2,
                price: stockOut.price,
                date: stockOut.date,
                billID: stockOut.billID,
                invoiceID: stockOut.invoiceID,
                adjustmentEventID: stockOut.adjustmentEventID,
                stockInID: stockIn._id,
              });
              q = 0;
            } else {
              await StockIn.updateOne(
                { _id: stockIn._id },
                { $set: { residue: 0 } }
              );

              await StockOut.create({
                itemID: stockOut.itemID,
                quantity: stockIn.residue,
                price: stockOut.price,
                date: stockOut.date,
                billID: stockOut.billID,
                invoiceID: stockOut.invoiceID,
                adjustmentEventID: stockOut.adjustmentEventID,
                stockInID: stockIn._id,
              });

              q -= stockIn.residue;
            }
          } else {
            // Handle the case where no stock in is found
            console.log(`No stock in found for item ${stockOut.itemID}`);
            await Overflow.create({
              quantity: q,
              billID: stockOut.billID,
              invoiceID: stockOut.invoiceID,
              adjustmentEventID: stockOut.adjustmentEventID,
              itemID: stockOut.itemID,
            });

            q = 0;
          }
        }

        console.log(`Item ${stockOut.itemID} is done`);
        console.log(`Progress ${i + 1}/${stockOutTobeUpdated.length}`);
      } catch (error) {
        console.error(`Error on item ${stockOut.itemID}`);
        console.error(`Error on index ${i}`);
        console.log(stockOutTobeUpdated[i]);
        throw error;
      }
    }
  });
});
