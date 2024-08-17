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
const store_model_1 = __importDefault(require("../models/store.model"));
const error_list_1 = require("../data/error-list");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const app_1 = require("../app");
class StoreController {
}
_a = StoreController;
StoreController.create = (req, res) => {
    const name = req.body.name;
    const address = req.body.address;
    const phoneNumber = req.body.phoneNumber;
    const prefix = req.body.prefix;
    const code = req.body.code;
    const userID = req.body.userID;
    store_model_1.default.preCreate({
        name: name,
        address: address,
        phoneNumber: phoneNumber,
        prefix: prefix,
        code: code,
    })
        .then((validation) => {
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["STORE_ALREADY_EXIST"]);
        }
        else {
            new store_model_1.default({
                name: name,
                address: address,
                phoneNumber: phoneNumber,
                prefix: prefix,
                code: code,
                createdBy: userID,
            })
                .create()
                .then((result) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on creating store ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "Store",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on pre-creating store ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Store",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StoreController.fetch = (req, res) => {
    const keyword = req.query.keyword;
    const page = !req.query.page ? 1 : parseInt(req.query.page);
    store_model_1.default.fetch({
        keyword: keyword,
        page: page,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching store ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Store",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StoreController.fetchByID = (req, res) => {
    const id = req.params.id;
    store_model_1.default.fetchByID(id)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching store ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Store",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StoreController.fetchAutocomplete = (req, res) => {
    const keyword = req.query.keyword;
    store_model_1.default.fetchAutocomplete(keyword)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching store autocomplete ${error}`,
            tag: "Store",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StoreController.fetchOthers = (req, res) => {
    const storeID = req.body.storeID;
    store_model_1.default.fetchOthers(storeID)
        .then((result) => {
        return res.status(200).send([
            {
                _id: null,
                name: "Office",
                address: "Jalan Raya Kerobokan no. 87A",
                phoneNumber: "0878-5426-8240",
                code: "",
            },
            ...result,
        ]);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching other stores ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Store",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StoreController.updateByID = (req, res) => {
    const name = req.body.name;
    const address = req.body.address;
    const phoneNumber = req.body.phoneNumber;
    const prefix = req.body.prefix;
    const id = req.body.id;
    const userID = req.body.userID;
    store_model_1.default.preUpdate({
        name: name,
        prefix: prefix,
        id: id,
    })
        .then((validation) => {
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["STORE_ALREADY_EXIST"]);
        }
        else {
            new store_model_1.default({
                name: name,
                address: address,
                phoneNumber: phoneNumber,
                prefix: prefix,
                id: id,
                createdBy: userID,
            })
                .update()
                .then((result) => {
                return res.status(200).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on updating store ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "Store",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on pre-updating store ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Store",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
StoreController.deleteByID = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    store_model_1.default.deleteByID(id, userID)
        .then((result) => __awaiter(void 0, void 0, void 0, function* () {
        yield app_1.redisClient.del(`store:${id}`);
        return res.status(200).send(result);
    }))
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on deleting store ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Store",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = StoreController;
//# sourceMappingURL=store.controller.js.map