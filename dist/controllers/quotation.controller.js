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
const quotation_model_1 = __importDefault(require("../models/quotation.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
class QuotationController {
}
_a = QuotationController;
QuotationController.create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const customer = req.body.customer_id;
    const date = new Date(req.body.date);
    const expiryDate = new Date(req.body.expiry_date);
    const note = req.body.note;
    const userID = req.body.userID;
    const items = req.body.items;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    quotation_model_1.default.countDocumentByMonthYear(month, year)
        .then((count) => {
        const name = "Q-CS-" +
            date.getFullYear() +
            "-" +
            (date.getMonth() + 1).toString().padStart(2, "0") +
            "-" +
            (count + 1).toString().padStart(4, "0");
        new quotation_model_1.default({
            name: name,
            date: date,
            expiryDate: expiryDate,
            customerID: customer,
            note: note,
            createdBy: userID,
            createdAt: new Date(),
            items: items,
        })
            .create()
            .then((result) => {
            return res.status(201).send(result);
        })
            .catch((error) => {
            console.error(`[error]: Error on creating quotation ${error}`);
            return res.status(500).send(error_list_1.ErrorList["QUOTATION_CREATE_FAILED"]);
        });
    })
        .catch((error) => {
        console.error(`[error]: Error on counting quotation ${error}`);
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
});
QuotationController.delete = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    quotation_model_1.default.fetchByID(id)
        .then((quotation) => {
        if (!quotation || quotation.isDelete) {
            return res.status(404).send(error_list_1.ErrorList["QUOTATION_NOT_FOUND"]);
        }
        else {
            quotation_model_1.default.deleteByID(id, userID)
                .then((result) => { })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on deleting quotation ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "Quotation",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on deleting quotation ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Quotation",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
QuotationController.fetchByID = (req, res) => {
    const id = req.params.id;
    quotation_model_1.default.fetchByID(id)
        .then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["QUOTATION_NOT_FOUND"]);
        }
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching quotation ${error}`,
            tag: "Quotation",
        }).log();
        return res.status(500).send(error);
    });
};
QuotationController.searchV2 = (req, res) => {
    const keyword = req.body.keyword;
    const page = req.body.page;
    const month = req.body.month + 1;
    const year = req.body.year;
    const status = req.body.status;
    quotation_model_1.default.search({
        keyword: keyword,
        page: page,
        month: month,
        year: year,
        status: status,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on searching quotation ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Quotation",
        }).log();
        return res.status(500).send(error);
    });
};
exports.default = QuotationController;
//# sourceMappingURL=quotation.controller.js.map