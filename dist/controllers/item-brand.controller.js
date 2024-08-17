"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_list_1 = require("../data/error-list");
const logger_interface_1 = require("../interfaces/logger.interface");
const item_brand_model_1 = __importDefault(require("../models/item-brand.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
class ItemBrandController {
}
ItemBrandController.create = (req, res) => {
    const name = req.body.name;
    const userID = req.body.userID;
    item_brand_model_1.default.preCreate({
        name: name,
    })
        .then((validation) => {
        if (!validation) {
            return res.status(404).send(error_list_1.ErrorList["ITEM_BRAND_ALREADY_EXIST"]);
        }
        else {
            new item_brand_model_1.default({
                name: name,
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
                    message: `Error on creating item brand ${error}`,
                    tag: "Item-brand",
                }).log();
                return res.status(500).send(error);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on pre-creating item brand ${error}`,
            tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
    });
};
ItemBrandController.fetch = (req, res) => {
    const page = req.query.page == null ? 1 : Number(req.query.page);
    const keyword = req.query.keyword == null ? "" : req.query.keyword.toString();
    item_brand_model_1.default.fetch({
        page: page,
        keyword: keyword,
    })
        .then((result) => {
        return res.status(200).send(result);
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
ItemBrandController.fetchV2 = (req, res) => {
    const page = req.query.page == null ? 1 : Number(req.query.page);
    const keyword = req.query.keyword == null ? "" : req.query.keyword.toString();
    item_brand_model_1.default.fetchV2({
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
ItemBrandController.fetchByID = (req, res) => {
    const id = req.params.id;
    item_brand_model_1.default.fetchByID(id)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching item brand by ID ${error}`,
            tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
    });
};
ItemBrandController.fetchAutocomplete = (req, res) => {
    const keyword = req.query.keyword == null ? "" : req.query.keyword.toString();
    item_brand_model_1.default.fetchAutocomplete(keyword)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching item brand autocomplete ${error}`,
            tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
    });
};
ItemBrandController.update = (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    item_brand_model_1.default.preUpdate({
        id: id,
        name: name,
    })
        .then((validation) => {
        if (!validation) {
            return res.status(404).send(error_list_1.ErrorList["ITEM_BRAND_ALREADY_EXIST"]);
        }
        else {
            new item_brand_model_1.default({
                id: id,
                name: name,
                createdAt: new Date(),
            })
                .update()
                .then(([result, _]) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on pre-updating item brand ${error}`,
                    tag: "Item-brand",
                }).log();
                return res.status(500).send(error);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on updating item brand ${error}`,
            tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
    });
};
ItemBrandController.delete = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    item_brand_model_1.default.preDelete({
        id: id,
    })
        .then((validation) => {
        if (!validation) {
            return res.status(404).send(error_list_1.ErrorList["ITEM_BRAND_NOT_FOUND"]);
        }
        else {
            new item_brand_model_1.default({
                id: id,
                createdBy: userID,
                createdAt: new Date(),
            })
                .delete()
                .then((result) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on deleting item brand ${error}`,
                    tag: "Item-brand",
                }).log();
                return res.status(500).send(error);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on pre-deleting item brand ${error}`,
            tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
    });
};
exports.default = ItemBrandController;
//# sourceMappingURL=item-brand.controller.js.map