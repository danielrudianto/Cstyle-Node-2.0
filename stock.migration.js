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

const AdjustmentEventItemSchema = new mongoose.Schema({
  itemID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "items",
  },
  quantity: { type: Number, required: true },
});

const AdjustmentEventSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  name: { type: String, required: true, unique: true },
  items: { type: [AdjustmentEventItemSchema], required: true },
  storeID: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "stores",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "users",
  },
  createdAt: { type: Date, required: true, default: Date.now },
  isDelete: { type: Boolean, required: true, default: false },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    default: null,
    ref: "users",
  },
  deletedAt: { type: Date, required: false, default: null },
});

const AdjustmentEvent = mongoose.model(
  "adjustment-events",
  AdjustmentEventSchema
);

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

const StockRequestItemSchema = new mongoose.Schema({
  itemID: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "items",
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const StockRequestSchema = new mongoose.Schema({
  requestFrom: {
    type: mongoose.Types.ObjectId,
    required: false,
    default: null,
    ref: "stores",
  },
  requestTo: {
    type: mongoose.Types.ObjectId,
    required: false,
    default: null,
    ref: "stores",
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  items: {
    type: [StockRequestItemSchema],
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  createdBy: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "users",
  },
  note: {
    type: String,
    required: false,
    default: "",
  },
  isSending: {
    type: Boolean,
    required: true,
    default: false,
  },
  sendBy: {
    type: mongoose.Types.ObjectId,
    required: false,
    ref: "users",
  },
  sendAt: {
    type: Date,
    required: false,
  },
  isConfirm: {
    type: Boolean,
    required: true,
    default: false,
  },
  isReject: {
    type: Boolean,
    required: true,
    default: false,
  },
  updatedBy: {
    type: mongoose.Types.ObjectId,
    required: false,
    ref: "users",
    default: null,
  },
  updatedAt: {
    type: Date,
    required: false,
    default: null,
  },
  rejectNote: {
    type: String,
    required: false,
    default: "",
  },
  isDelete: {
    type: Boolean,
    required: true,
    default: false,
  },
  deletedBy: {
    type: mongoose.Types.ObjectId,
    required: false,
    ref: "users",
    default: null,
  },
  deletedAt: {
    type: Date,
    required: false,
    default: null,
  },
});

const StockRequest = mongoose.model("stock-requests", StockRequestSchema);

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

const StockSchema = new mongoose.Schema({
  itemID: { type: mongoose.Types.ObjectId, required: true, ref: "items" },
  storeID: { type: mongoose.Types.ObjectId, required: false, ref: "stores" },
  quantity: { type: Number, required: true },
});

const Stock = mongoose.model("stocks", StockSchema);

const ItemSchema = new mongoose.Schema({
  reference: { type: String, unique: false, required: true },
  description: { type: String, required: true },
  itemTypeID: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "itemtypes",
  },
  itemBrandID: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "itembrands",
  },
  createdBy: { type: mongoose.Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: Date.now() },
  isDelete: { type: Boolean, required: true, default: false },
  deletedBy: { type: mongoose.Types.ObjectId, default: null, ref: "users" },
  deletedAt: { type: Date, default: null },
  images: { type: [String], default: [] },
  price: { type: Number, required: true, default: 0 },
  barcode: { type: String, required: false, default: "" },
  isFavorite: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
});

const Item = mongoose.model("items", ItemSchema);

const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: false },
  prefix: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Types.ObjectId, required: true, ref: "users" },
  createdAt: { type: Date, required: true, default: new Date() },
  isActive: { type: Boolean, required: true, default: true },
  deletedBy: { type: mongoose.Types.ObjectId, required: false, default: null },
  deletedAt: { type: Date, required: false, default: null },
});

const Store = mongoose.model("stores", StoreSchema);

Promise.all([
  Item.find({}),
  Store.find({
    isActive: true,
  }),
  GoodReceipt.find({
    isDelete: false,
  }),
  AdjustmentEvent.find({
    isDelete: false,
  }),
  StockRequest.find({
    isSending: true,
    isReject: false,
    isConfirm: true,
  }),
  StockRequest.find({
    isSending: true,
    isReject: false,
    isConfirm: false,
  }),
  Bill.find({
    isDelete: false,
  }),
  PackingList.find({
    isDelete: false,
  }),
]).then(
  async ([
    items,
    stores,
    goodReceipts,
    adjustmentEvents,
    sentStockRequests,
    sendingStockRequests,
    bills,
    packingLists,
  ]) => {
    const create = [];

    for (let j = 0; j < items.length; j++) {
      for (let i = 0; i < stores.length; i++) {
        create.push({
          itemID: items[j]._id,
          storeID: stores[i]._id,
          quantity: 0,
        });
      }

      create.push({
        itemID: items[j]._id,
        storeID: null,
        quantity: 0,
      });
    }

    Stock.insertMany(create).then(async () => {
      console.log("Successfully created stock");

      const updates = [];

      for (let i = 0; i < goodReceipts.length; i++) {
        for (let j = 0; j < goodReceipts[i].items.length; j++) {
          const itemID = goodReceipts[i].items[j].itemID;
          const quantity = goodReceipts[i].items[j].quantity;

          updates.push({
            filter: { itemID: itemID, storeID: null },
            update: { $inc: { quantity: quantity } },
          });
        }

        console.log(
          `Good receipt ${i + 1} out of ${goodReceipts.length} inserted`
        );
      }

      for (let i = 0; i < adjustmentEvents.length; i++) {
        const storeID = adjustmentEvents[i].storeID;
        for (let j = 0; j < adjustmentEvents[i].items.length; j++) {
          const itemID = adjustmentEvents[i].items[j].itemID;
          const quantity = adjustmentEvents[i].items[j].quantity;

          updates.push({
            filter: { itemID: itemID, storeID: storeID },
            update: { $inc: { quantity: quantity } },
          });
        }

        console.log(
          `Adjustment event ${i + 1} out of ${adjustmentEvents.length} inserted`
        );
      }

      for (let i = 0; i < sentStockRequests.length; i++) {
        const requestFrom = sentStockRequests[i].requestFrom;
        const requestTo = sentStockRequests[i].requestTo;
        for (let j = 0; j < sentStockRequests[i].items.length; j++) {
          const itemID = sentStockRequests[i].items[j].itemID;
          const quantity = sentStockRequests[i].items[j].quantity;

          updates.push({
            filter: { itemID: itemID, storeID: requestFrom },
            update: { $inc: { quantity: quantity } },
          });

          updates.push({
            filter: { itemID: itemID, storeID: requestTo },
            update: { $inc: { quantity: -quantity } },
          });
        }

        console.log(
          `Sent stock request ${i + 1} out of ${
            sentStockRequests.length
          } inserted`
        );
      }

      for (let i = 0; i < sendingStockRequests.length; i++) {
        const requestTo = sendingStockRequests[i].requestTo;
        for (let j = 0; j < sendingStockRequests[i].items.length; j++) {
          const itemID = sendingStockRequests[i].items[j].itemID;
          const quantity = sendingStockRequests[i].items[j].quantity;

          updates.push({
            filter: { itemID: itemID, storeID: requestTo },
            update: { $inc: { quantity: -quantity } },
          });
        }

        console.log(
          `Sending stock request ${i + 1} out of ${
            sendingStockRequests.length
          } inserted`
        );
      }

      for (let i = 0; i < bills.length; i++) {
        const storeID = bills[i].storeID;
        for (let j = 0; j < bills[i].items.length; j++) {
          const itemID = bills[i].items[j].itemID;
          const quantity = bills[i].items[j].quantity;

          updates.push({
            filter: { itemID: itemID, storeID: storeID },
            update: { $inc: { quantity: -quantity } },
          });
        }
      }

      for (let i = 0; i < packingLists.length; i++) {
        for (let j = 0; j < packingLists[i].items.length; j++) {
          const itemID = packingLists[i].items[j].itemID;
          const quantity = packingLists[i].items[j].quantity;

          updates.push({
            filter: { itemID: itemID, storeID: null },
            update: { $inc: { quantity: -quantity } },
          });
        }

        console.log(
          `Packing list ${i + 1} out of ${packingLists.length} inserted`
        );
      }

      for (let i = 0; i < updates.length; i++) {
        try {
          const filter = updates[i].filter;
          const update = updates[i].update;
          console.log(`Filter: ${JSON.stringify(filter)}`);
          console.log(`Update: ${JSON.stringify(update)}`);
          const result = await Stock.updateMany(filter, update);
          console.log(`Result: ${JSON.stringify(result)}`);
          console.log(`Update ${i + 1} out of ${updates.length} inserted`);
        } catch (error) {
          console.log(error);
        }
      }
    });
  }
);
