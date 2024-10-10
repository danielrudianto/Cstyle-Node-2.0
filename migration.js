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

const invoiceItemSchema = new mongoose.Schema({
  itemID: mongoose.Schema.Types.ObjectId,
  quantity: Number,
  price: Number,
  discount: Number,
});

const invoiceSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  date: Date,
  billID: mongoose.Schema.Types.ObjectId,
  items: [invoiceItemSchema],
});

const Invoice = mongoose.model("invoices", invoiceSchema);

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
  }).sort({ date: 1 }),
]).then(async ([goodReceipts, adjustmentEvents, bills, invoices]) => {
  const stockInToBeInserted = [];

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
      }
    }
  }

  // bills.forEach(async (x, index) => {
  //   // update the items
  //   x.items.forEach((y) => {
  //     y.price = y.price;
  //     y.cogs = undefined;
  //     y.discount = y.discount;
  //     y.percentage = (discount * 100) / price;
  //   });

  //   // update the bill
  //   await x.save();
  //   console.log(`Completed ${index + 1} of ${bills.length} bills`);
  // });

  // Insert the stock ins
  await StockIn.insertMany(stockInToBeInserted)
    .then(async () => {
      const stockOuts = [];
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

          stockOuts.push(stockOut);
        }
      }

      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];
        const items = invoice.items;

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

          stockOuts.push(stockOut);
        }
      }

      for (let i = 0; i < adjustmentEvents.length; i++) {
        const adjustmentEvent = adjustmentEvents[i];
        const items = adjustmentEvent.items;

        for (let j = 0; j < items.length; j++) {
          const item = items[j];
          if (item.quantity < 0) {
            const stockOut = {
              itemID: item.itemID,
              quantity: -item.quantity,
              price: 0,
              date: adjustmentEvent.date,
              billID: null,
              invoiceID: null,
              adjustmentEventID: adjustmentEvent._id,
            };

            stockOuts.push(stockOut);
          }
        }
      }

      // sort the stock out by date
      stockOuts.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Insert the stock outs
      for (let i = 0; i < stockOuts.length; i++) {
        // First search stock in with the same itemID and residue > 0
        var quantity = stockOuts[i].quantity;

        while (quantity > 0) {
          const stockIn = await StockIn.findOne(
            {
              itemID: stockOuts[i].itemID,
              residue: { $gt: 0 },
            },
            null,
            { sort: { date: 1 } }
          );

          if (!stockIn) {
            console.error(
              `Cannot find stock in for item ${stockOuts[i].itemID}`
            );
            break;
          } else {
            const stockOut = {
              itemID: stockIn.itemID,
              quantity: Math.min(quantity, stockIn.residue),
              price: stockOuts[i].price,
              date: stockOuts[i].date,
              billID: stockOuts[i].billID,
              invoiceID: stockOuts[i].invoiceID,
              stockInID: stockIn._id,
              itemID: stockIn.itemID,
            };

            quantity -= stockOut.quantity;
            stockIn.residue -= stockOut.quantity;
            await stockIn.save();
            await StockOut.create(stockOut);
          }
        }

        console.log(`Completed ${i + 1} of ${stockOuts.length} stock outs`);
      }
    })
    .catch((error) => {
      console.error(`Error on inserting stock ins: ${error}`);
    });
});
