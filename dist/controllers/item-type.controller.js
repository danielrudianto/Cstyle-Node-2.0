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
const item_type_model_1 = __importDefault(require("../models/item-type.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const queue_utils_1 = require("../utils/queue.utils");
class ItemTypeController {
}
_a = ItemTypeController;
ItemTypeController.create = (req, res) => {
    const name = req.body.name;
    const description = req.body.description;
    const userID = req.body.userID;
    item_type_model_1.default.preCreate({
        name: name,
        description: description,
    })
        .then((validation) => {
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["ITEM_TYPE_ALREADY_EXIST"]);
        }
        else {
            new item_type_model_1.default({
                name: name,
                description: description,
                createdBy: userID,
                createdAt: new Date(),
            })
                .create()
                .then((result) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on creating item type ${error}`,
                    tag: "item-type",
                }).log();
                return res.status(500).send(error);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on pre-creating item type ${error}`,
            tag: "item-type",
        }).log();
        return res.status(500).send(error);
    });
};
ItemTypeController.update = (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const description = req.body.description;
    item_type_model_1.default.preUpdate({
        name: name,
        id: id,
    })
        .then((validation) => {
        if (!validation) {
            return res.status(404).send(error_list_1.ErrorList["ITEM_TYPE_NOT_FOUND"]);
        }
        else {
            new item_type_model_1.default({
                name: name,
                description: description,
                id: id,
            })
                .update()
                .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                yield queue_utils_1.queue.add("update-item-type", {
                    name: name,
                    id: id,
                });
                return res.status(201).send(Object.assign(Object.assign({}, result), { name: name, description: description }));
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on updating item type ${error}`,
                    tag: "item-type",
                }).log();
                return res.status(500).send(error);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on pre-updating item type ${error}`,
            tag: "item-type",
        }).log();
        return res.status(500).send(error);
    });
};
ItemTypeController.delete = (req, res) => {
    const id = req.params.id;
    item_type_model_1.default.preDelete({
        id: id,
    })
        .then((validation) => {
        if (!validation) {
            return res.status(404).send(error_list_1.ErrorList["ITEM_TYPE_NOT_FOUND"]);
        }
        else {
            new item_type_model_1.default({
                id: id,
            })
                .delete()
                .then((result) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                console.error(`[error]: Error on deleting item type ${error}`);
                return res.status(500).send(error);
            });
        }
    })
        .catch((error) => {
        console.error(`[error]: Error on pre deleting item type ${error}`);
        return res.status(500).send(error);
    });
};
ItemTypeController.fetchV2 = (req, res) => {
    const page = req.query.page == null ? 1 : Number(req.query.page);
    const keyword = req.query.keyword == null ? "" : req.query.keyword.toString();
    item_type_model_1.default.fetchV2({
        page: page,
        keyword: keyword,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching item brand ${error}`,
            tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
    });
};
ItemTypeController.fetchByID = (req, res) => {
    const id = req.params.id;
    item_type_model_1.default.fetchByID(id)
        .then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["ITEM_TYPE_NOT_FOUND"]);
        }
        else {
            return res.status(200).send(result);
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching item type ${error}`,
            tag: "Item type",
            type: logger_interface_1.LoggerType.error,
        });
    });
};
ItemTypeController.fetchAutocomplete = (req, res) => {
    const keyword = req.query.keyword == null ? "" : req.query.keyword.toString();
    item_type_model_1.default.fetchAutocomplete(keyword)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching item type autocomplete ${error}`,
            tag: "Item type",
            type: logger_interface_1.LoggerType.error,
        });
        return res.status(500).send(error);
    });
};
exports.default = ItemTypeController;
//# sourceMappingURL=item-type.controller.js.map