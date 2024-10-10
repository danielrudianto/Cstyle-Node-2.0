"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../models/user.model"));
const item_model_1 = __importDefault(require("../models/item.model"));
const migration_model_1 = __importDefault(require("../models/migration.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const error_list_1 = require("../data/error-list");
const bill_model_1 = __importDefault(require("../models/bill.model"));
const app_1 = require("../app");
const membership_model_1 = __importDefault(require("../models/membership.model"));
const queue_utils_1 = require("../utils/queue.utils");
const stock_in_model_1 = __importDefault(require("../models/stock-in.model"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
const stock_card_model_1 = __importDefault(require("../models/stock-card.model"));
const overflow_model_1 = __importDefault(require("../models/overflow.model"));
const stock_out_model_1 = __importDefault(require("../models/stock-out.model"));
const adjustment_model_1 = __importDefault(require("../models/adjustment.model"));
class WorkerController {
    static createProduct(data) {
        item_model_1.default.fetchByID(data.id)
            .then((result) => __awaiter(this, void 0, void 0, function* () {
            if (result) {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.info,
                    message: `Product ${result.reference} created`,
                    tag: "Worker",
                }).log();
                return yield migration_model_1.default.createProduct({
                    reference: result.reference,
                    description: result.description,
                    barcode: result.barcode == undefined ? null : result.barcode,
                    brand: typeof result.itemBrandID != "string"
                        ? result.itemBrandID.name
                        : "",
                    type: typeof result.itemTypeID != "string"
                        ? result.itemTypeID.name
                        : "",
                    brandID: typeof result.itemBrandID == "string"
                        ? result.itemBrandID
                        : result.itemBrandID._id,
                    typeID: typeof result.itemTypeID == "string"
                        ? result.itemTypeID
                        : result.itemTypeID._id,
                    price: result.price,
                    id: result._id.toString(),
                    isActive: result.isActive,
                    images: result.images,
                });
            }
            else {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Unable to find item with id ${data.toString()}`,
                    tag: "Worker",
                }).log();
                throw Error(error_list_1.ErrorList["ITEM_NOT_FOUND"]);
            }
        }))
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on creating product ${error}`,
                tag: "Worker",
            }).log();
            throw Error(error);
        });
    }
    static updateProduct(data) {
        item_model_1.default.fetchByID(data.id)
            .then((result) => __awaiter(this, void 0, void 0, function* () {
            if (result) {
                try {
                    return yield migration_model_1.default.updateProduct({
                        reference: result.reference,
                        description: result.description,
                        barcode: result.barcode == undefined ? null : result.barcode,
                        brand: typeof result.itemBrandID != "string"
                            ? result.itemBrandID.name
                            : "",
                        type: typeof result.itemTypeID != "string"
                            ? result.itemTypeID.name
                            : "",
                        brandID: typeof result.itemBrandID == "string"
                            ? result.itemBrandID
                            : result.itemBrandID._id,
                        typeID: typeof result.itemTypeID == "string"
                            ? result.itemTypeID
                            : result.itemTypeID._id,
                        price: result.price,
                        id: result._id.toString(),
                        isActive: result.isActive,
                        images: [],
                    });
                }
                catch (error) {
                    new logger_utils_1.default({
                        type: logger_interface_1.LoggerType.error,
                        message: `Error on updating migration for product ${error}`,
                        tag: "Worker",
                    }).log();
                    throw error;
                }
            }
            else {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Product with id ${data} not found`,
                    tag: "Worker",
                });
                throw new Error("Product not found");
            }
        }))
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on creating fetching product ${error}`,
                tag: "Worker",
            }).log();
            throw new Error(error);
        });
    }
    static updateProductType(data) {
        const id = data.id;
        const name = data.name;
        migration_model_1.default.updateProductType({
            id: id,
            name: name,
        })
            .then(() => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.info,
                message: `Product type updated for product ${id}`,
                tag: "Worker",
            }).log();
        })
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on updating product type ${error}`,
                tag: "Worker",
            }).log();
            throw new Error(error);
        });
    }
    static updateProductBrand(data) {
        const id = data.id;
        const name = data.name;
        migration_model_1.default.updateProductBrand({
            id: id,
            name: name,
        })
            .then(() => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.info,
                message: `Product brand updated for product ${id}`,
                tag: "Worker",
            }).log();
        })
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on updating product brand ${error}`,
                tag: "Worker",
            }).log();
            throw new Error(error);
        });
    }
    static updateProductImages(data) {
        const id = data.id;
        const images = data.images;
        migration_model_1.default.updateProductImages({
            id,
            images: images,
        })
            .then(() => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.info,
                message: `Product images updated for product ${id}`,
                tag: "Worker",
            }).log();
        })
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on updating product images ${error}`,
                tag: "Worker",
            }).log();
            throw new Error(error);
        });
    }
    static deleteProduct(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = data.id;
            item_model_1.default.fetchByID(id).then((item) => __awaiter(this, void 0, void 0, function* () {
                if (!item) {
                    throw Error(error_list_1.ErrorList["ITEM_NOT_FOUND"]);
                }
                yield migration_model_1.default.deleteProduct(id);
                item.images.forEach((x) => __awaiter(this, void 0, void 0, function* () {
                    yield migration_model_1.default.deleteProductImage(x, id);
                }));
            }));
        });
    }
    static createUser(data) {
        user_model_1.default.fetchByID(data.id)
            .then((user) => {
            if (!user) {
                throw Error(error_list_1.ErrorList["USER_NOT_FOUND"]);
            }
            else {
                migration_model_1.default.createUser({
                    name: user.name,
                    userID: user._id.toString(),
                    code: user.code,
                });
            }
        })
            .catch((error) => {
            throw new Error(error);
        });
    }
    static updateUser(data) {
        user_model_1.default.fetchByID(data.id)
            .then((user) => {
            if (!user) {
                throw Error(error_list_1.ErrorList["USER_NOT_FOUND"]);
            }
            else {
                migration_model_1.default.updateUser({
                    name: user.name,
                    userID: user._id.toString(),
                    code: user.code,
                });
            }
        })
            .catch((error) => {
            throw new Error(error);
        });
    }
    static deleteUser(data) {
        migration_model_1.default.deleteUser(data.id)
            .then((result) => {
            return result;
        })
            .catch((error) => {
            throw Error(error);
        });
    }
    static createBill(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield bill_model_1.default.fetchByID(data.id);
            if (!result) {
                throw Error(error_list_1.ErrorList["BILL_NOT_FOUND"]);
            }
            else {
                const value = result.items.reduce((acc, item) => {
                    return acc + (item.price - item.discount) * item.quantity;
                }, 0);
                if (result.memberID != null) {
                    const conversion = yield app_1.redisClient.get("conversion");
                    const point = Number(conversion) == 0 ? 0 : Math.floor(value / Number(conversion));
                    yield membership_model_1.default.updatePoint(result.memberID, point);
                }
                result.items.forEach((x) => __awaiter(this, void 0, void 0, function* () {
                    const item = {
                        date: result.date,
                        itemID: x.itemID._id,
                        quantity: x.quantity,
                        adjustmentEventID: null,
                        storeID: result.storeID,
                        billID: result._id.toString(),
                        invoiceID: null,
                    };
                    yield queue_utils_1.queue.add("insertStockOut", item);
                }));
            }
        });
    }
    static deleteAdjustment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const adjustmentEvent = yield adjustment_model_1.default.fetchByID(data.id);
            if (!adjustmentEvent || !adjustmentEvent.isDelete) {
                throw Error(error_list_1.ErrorList["ADJUSTMENT_EVENT_NOT_FOUND"]);
            }
            adjustmentEvent.items.forEach((x) => __awaiter(this, void 0, void 0, function* () {
                if (x.quantity > 0) {
                    const removeStockInData = {
                        itemID: x.itemID._id,
                        quantity: x.quantity,
                        storeID: adjustmentEvent.storeID == null
                            ? null
                            : adjustmentEvent.storeID._id,
                        goodReceiptID: null,
                        adjustmentCaseID: data.id,
                    };
                    yield queue_utils_1.queue.add("removeStockIn", removeStockInData);
                }
                else if (x.quantity < 0) {
                    const removeStockOutData = {
                        itemID: x.itemID,
                        quantity: x.quantity,
                        storeID: adjustmentEvent.storeID == null
                            ? null
                            : adjustmentEvent.storeID._id,
                        billID: null,
                        invoiceID: null,
                        adjustmentCaseID: data.id,
                    };
                    yield queue_utils_1.queue.add("removeStockOut", removeStockOutData);
                }
                yield queue_utils_1.queue.add("checkOverflow", {});
            }));
        });
    }
    static insertStockIn(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result, _] = yield Promise.all([
                new stock_in_model_1.default({
                    date: data.date,
                    itemID: data.itemID,
                    quantity: data.quantity,
                    residue: data.quantity,
                    price: data.price,
                    goodReceiptID: data.goodReceiptID,
                    adjustmentEventID: data.adjustmentEventID,
                    storeID: data.storeID,
                }).create(),
                new stock_card_model_1.default({
                    itemID: data.itemID,
                    quantity: data.quantity,
                    date: data.date,
                    billID: null,
                    invoiceID: null,
                    adjustmentEventID: data.adjustmentEventID,
                    goodReceiptID: data.goodReceiptID,
                    deliverySlipID: null,
                }),
            ]);
            return result._id;
        });
    }
    static removeStockIn(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield stock_in_model_1.default.fetchDeletation(data);
            const stockOuts = yield stock_out_model_1.default.fetchByStockInID(result._id);
            if (stockOuts.length > 0) {
                const promises = stockOuts.map((x) => __awaiter(this, void 0, void 0, function* () {
                    yield new overflow_model_1.default({
                        itemID: data.itemID,
                        quantity: x.quantity,
                        billID: x.billID,
                        adjustmentEventID: x.adjustmentEventID,
                        invoiceID: x.invoiceID,
                    }).create();
                }));
                promises.push(...stockOuts.map((x) => __awaiter(this, void 0, void 0, function* () {
                    yield stock_out_model_1.default.deleteByID(x._id);
                })));
                yield Promise.all(promises);
            }
            const deleteStockIn = {
                itemID: data.itemID,
                adjustmentEventID: data.adjustmentCaseID,
                goodReceiptID: data.goodReceiptID,
            };
            yield stock_in_model_1.default.delete(deleteStockIn);
            yield queue_utils_1.queue.add("checkOverflow", {});
        });
    }
    static insertStockOut(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var quantity = data.quantity;
            while (quantity > 0) {
                if (quantity == 0) {
                    break;
                }
                var stockIn = yield stock_in_model_1.default.fetchFifo(data.itemID);
                if (!stockIn) {
                    yield new overflow_model_1.default({
                        itemID: data.itemID,
                        quantity: quantity,
                        billID: data.billID,
                        adjustmentEventID: data.adjustmentEventID,
                        invoiceID: data.invoiceID,
                    }).create();
                    quantity = 0;
                    break;
                }
                else if (stockIn.residue >= quantity) {
                    yield Promise.all([
                        new stock_out_model_1.default({
                            stockInID: stockIn._id.toString(),
                            itemID: data.itemID,
                            date: data.date,
                            quantity: quantity,
                            billID: data.billID,
                            adjustmentEventID: data.adjustmentEventID,
                            invoiceID: data.invoiceID,
                            storeID: data.storeID,
                        }).create(),
                        stock_in_model_1.default.updateResidue(stockIn._id, quantity),
                    ]);
                    quantity = 0;
                    break;
                }
                else if (stockIn.residue < quantity) {
                    yield Promise.all([
                        new stock_out_model_1.default({
                            stockInID: stockIn._id.toString(),
                            itemID: data.itemID,
                            date: data.date,
                            quantity: stockIn.residue,
                            billID: data.billID,
                            adjustmentEventID: data.adjustmentEventID,
                            invoiceID: data.invoiceID,
                            storeID: data.storeID,
                        }).create(),
                        stock_in_model_1.default.updateResidue(stockIn._id, stockIn.residue),
                    ]);
                    quantity = quantity - stockIn.residue;
                }
            }
            yield new stock_card_model_1.default({
                itemID: data.itemID,
                quantity: data.quantity,
                date: data.date,
                billID: data.billID,
                invoiceID: data.invoiceID,
                adjustmentEventID: data.adjustmentEventID,
                goodReceiptID: null,
                deliverySlipID: null,
            }).create();
        });
    }
    static removeStockOut(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield stock_out_model_1.default.fetchDeletation(data);
            result.forEach((x) => __awaiter(this, void 0, void 0, function* () {
                yield stock_in_model_1.default.updateResidue(x.stockIn._id, x.quantity * -1);
                yield stock_out_model_1.default.deleteByID(x._id);
            }));
        });
    }
    static insertStockOutOnly(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let quantity = data.quantity;
            while (quantity > 0) {
                if (quantity == 0) {
                    break;
                }
                const stockIn = yield stock_in_model_1.default.fetchFifo(data.itemID);
                if (!stockIn) {
                    yield new overflow_model_1.default({
                        itemID: data.itemID,
                        quantity: quantity,
                        billID: data.billID,
                        adjustmentEventID: data.adjustmentEventID,
                        invoiceID: data.invoiceID,
                    }).create();
                    quantity = 0;
                    break;
                }
                else if (stockIn.quantity >= quantity) {
                    yield Promise.all([
                        new stock_out_model_1.default({
                            stockInID: stockIn._id.toString(),
                            itemID: data.itemID,
                            date: data.date,
                            quantity: quantity,
                            billID: data.billID,
                            adjustmentEventID: data.adjustmentEventID,
                            invoiceID: data.invoiceID,
                            storeID: data.storeID,
                        }).create(),
                        stock_in_model_1.default.updateResidue(stockIn._id, quantity),
                    ]);
                    quantity = 0;
                    break;
                }
                else if (stockIn.quantity < quantity) {
                    yield Promise.all([
                        new stock_out_model_1.default({
                            stockInID: stockIn._id.toString(),
                            itemID: data.itemID,
                            date: data.date,
                            quantity: stockIn.quantity,
                            billID: data.billID,
                            adjustmentEventID: data.adjustmentEventID,
                            invoiceID: data.invoiceID,
                            storeID: data.storeID,
                        }).create(),
                        stock_in_model_1.default.updateResidue(stockIn._id, stockIn.quantity),
                    ]);
                    quantity = quantity - stockIn.quantity;
                }
            }
        });
    }
    static insertStockOutCardOnly(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new stock_card_model_1.default({
                itemID: data.itemID,
                quantity: Math.abs(data.quantity) * -1,
                date: data.date,
                billID: null,
                invoiceID: null,
                adjustmentEventID: null,
                goodReceiptID: null,
                deliverySlipID: data.deliverySlipID,
            }).create();
            yield new stock_model_1.default({
                itemID: data.itemID,
                quantity: Math.abs(data.quantity) * -1,
                storeID: null,
            }).update();
        });
    }
    static removeStockOutCardOnly(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield stock_card_model_1.default.deleteByDeliverySlipID(data.deliverySlipID);
            yield new stock_model_1.default({
                itemID: data.itemID,
                quantity: Math.abs(data.quantity),
                storeID: null,
            }).update();
        });
    }
    static stockOutTransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield new stock_model_1.default({
                    itemID: data.itemID,
                    quantity: Math.abs(data.quantity) * -1,
                    storeID: data.storeID,
                }).update();
                return true;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static stockInTransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield new stock_model_1.default({
                    itemID: data.itemID,
                    quantity: Math.abs(data.quantity),
                    storeID: data.storeID,
                }).update();
                return true;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static checkOverflow() {
        return __awaiter(this, void 0, void 0, function* () {
            const overflows = yield overflow_model_1.default.fetchAll();
            for (let i = 0; i < overflows.length; i++) {
                const data = {
                    quantity: overflows[i].quantity,
                    itemID: overflows[i].itemID,
                    billID: overflows[i].billID,
                    invoiceID: overflows[i].invoiceID,
                    adjustmentEventID: overflows[i].adjustmentEventID,
                    storeID: null,
                    date: new Date(),
                };
                yield queue_utils_1.queue.add("insertStockOutOnly", data);
                yield overflow_model_1.default.deleteByID(overflows[i]._id);
            }
        });
    }
}
exports.default = WorkerController;
//# sourceMappingURL=worker.controller.js.map