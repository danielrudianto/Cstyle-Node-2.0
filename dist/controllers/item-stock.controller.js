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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const error_list_1 = require("../data/error-list");
const logger_interface_1 = require("../interfaces/logger.interface");
const item_model_1 = __importDefault(require("../models/item.model"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const store_model_1 = __importDefault(require("../models/store.model"));
class ItemStockController {
}
_a = ItemStockController;
ItemStockController.fetch = (req, res) => {
    const storeID = req.body.storeID;
    const keyword = req.query.keyword;
    const page = !req.query.page ? 1 : parseInt(req.query.page.toString());
    item_model_1.default.fetch({
        keyword: keyword,
        page: page,
        onlyActive: false,
    })
        .then(([items, itemCount]) => {
        stock_model_1.default.checkDashboardStockByItemIDs(items.map((x) => {
            return {
                itemID: x._id,
                quantity: 0,
            };
        }), storeID)
            .then(([onPremiseStock, otherStock]) => {
            return res.status(200).send({
                data: items.map((x) => {
                    const stockIndex = onPremiseStock.findIndex((y) => y._id.toString() == x._id.toString());
                    const otherStockIndex = otherStock.findIndex((y) => y._id.toString() == x._id.toString());
                    return {
                        reference: x.reference,
                        description: x.description,
                        onPremiseStock: stockIndex == -1 ? 0 : onPremiseStock[stockIndex].quantity,
                        otherStock: otherStockIndex == -1
                            ? 0
                            : otherStock[otherStockIndex].quantity,
                        _id: x._id,
                    };
                }),
                count: itemCount,
            });
        })
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on checking stock: ${error.message}`,
                tag: "ItemStockController",
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching item stock: ${error}`,
            tag: "ItemStockController",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemStockController.fetchStockByStoreID = (req, res) => {
    const keyword = req.body.keyword;
    const page = req.body.page;
    const storeID = req.body.targetStoreID === "null" ? null : req.body.targetStoreID;
    item_model_1.default.fetchV2WStock({
        page: page,
        keyword: keyword,
        branch: storeID,
        onlyActive: false,
    })
        .then((_b) => __awaiter(void 0, [_b], void 0, function* ([items, count]) {
        return res.status(200).send({
            data: items,
            count: count,
        });
    }))
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching item stock: ${error}`,
            tag: "ItemStockController",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemStockController.fetchByItemID = (req, res) => {
    const id = req.params.id;
    Promise.all([
        item_model_1.default.fetchByID(id),
        stock_model_1.default.fetchByItemID(id),
    ])
        .then(([item, result]) => {
        return res.status(200).send({
            item: item,
            stock: result,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching item stock: ${error}`,
            tag: "ItemStockController",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemStockController.download = (req, res) => {
    Promise.all([
        stock_model_1.default.fetchInitial(),
        item_model_1.default.download(),
        store_model_1.default.fetchOthers(null),
    ])
        .then(([stocks, items, stores]) => {
        return res.status(200).send({
            stores: stores,
            items: items,
            stocks: stocks,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on downloading item stock: ${error}`,
            tag: "ItemStockController",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
ItemStockController.fetchByStoreID = (req, res) => { };
exports.default = ItemStockController;
//# sourceMappingURL=item-stock.controller.js.map