"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
const bill_model_1 = __importDefault(require("../models/bill.model"));
const error_list_1 = require("../data/error-list");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
class BillController {
}
BillController.fetch = (req, res) => {
    const userID = req.body.userID;
    const page = req.body.page;
    const keyword = req.body.keyword;
    const month = req.body.month;
    const year = req.body.year;
    const storeID = req.body.storeID;
    app_1.redisClient
        .get(`users:${userID}`)
        .then((data) => {
        const user = JSON.parse(data);
        const role = user.accessLevel;
        bill_model_1.default.fetch({
            month: month,
            year: year,
            page: page,
            keyword: keyword,
            storeID: storeID,
            isOwner: role == 1,
        })
            .then(([result, count]) => {
            return res.status(200).send({
                data: result,
                count: count,
            });
        })
            .catch((error) => {
            new logger_utils_1.default({
                message: `Error on fetching bills ${error}`,
                type: logger_interface_1.LoggerType.error,
                tag: "Bill",
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user on bill ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Bill",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = BillController;
//# sourceMappingURL=bill.controller.js.map