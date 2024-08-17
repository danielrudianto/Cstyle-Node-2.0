"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bill_model_1 = __importDefault(require("../models/bill.model"));
const item_model_1 = __importDefault(require("../models/item.model"));
const membership_model_1 = __importDefault(require("../models/membership.model"));
const error_list_1 = require("..//data/error-list");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const item_brand_model_1 = __importDefault(require("../models/item-brand.model"));
const item_type_model_1 = __importDefault(require("../models/item-type.model"));
class StatusController {
}
StatusController.fetchStatusDashboard = (req, res) => {
    Promise.all([
        membership_model_1.default.count(),
        item_model_1.default.fetchPopular(),
        bill_model_1.default.fetchStatus(),
    ])
        .then(([[memberCountStore, memberCountCountires], popularItems, [dailySales, weeklySales, biWeeklySales, monthlySales],]) => {
        return res.status(200).send({
            memberCount: memberCountStore.reduce((a, b) => a + b.count, 0),
            popularItems: popularItems,
            memberMap: memberCountCountires
                .filter((x) => x._id != null)
                .map((x) => {
                return {
                    count: x.count,
                    nationality: x._id,
                };
            }),
            memberStoreMap: memberCountStore.map((x) => {
                return {
                    count: x.count,
                    storeID: x.store,
                };
            }),
            sales: {
                daily: dailySales.length == 0 ? 0 : dailySales[0].value,
                weekly: weeklySales.length == 0 ? 0 : weeklySales[0].value,
                biweekly: biWeeklySales.length == 0 ? 0 : biWeeklySales[0].value,
                monthly: monthlySales.length == 0 ? 0 : monthlySales[0].value,
            },
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching status dashboard ${error}`,
            tag: "Status",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StatusController.fetchStatusMembership = (req, res) => {
    Promise.all([
        membership_model_1.default.count(),
        membership_model_1.default.countNewMembers(),
        bill_model_1.default.fetchMemberTransactions(),
    ])
        .then(([[memberCount, _], memberNewCount, transactions]) => {
        return res.status(200).send({
            total: memberCount.reduce((a, b) => a + b.count, 0),
            recent: memberNewCount,
            recentTransactions: transactions,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching status membership ${error}`,
            tag: "Status",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StatusController.fetchStatusItem = (req, res) => {
    Promise.all([
        item_model_1.default.count(),
        item_brand_model_1.default.count(),
        item_type_model_1.default.count(),
    ]).then(([item, brand, type]) => {
        return res.status(200).send({
            item: item,
            brand: brand,
            type: type,
        });
    });
};
exports.default = StatusController;
//# sourceMappingURL=status.controller.js.map