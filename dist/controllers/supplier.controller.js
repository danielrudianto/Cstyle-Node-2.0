"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supplier_model_1 = __importDefault(require("../models/supplier.model"));
const error_list_1 = require("../data/error-list");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
class SupplierController {
}
SupplierController.create = (req, res) => {
    const name = req.body.name;
    const address = req.body.address;
    const email = req.body.email;
    const phone = req.body.phone;
    const npwp = req.body.npwp;
    const userID = req.body.userID;
    supplier_model_1.default.preCreate(name).then((validation) => {
        if (!validation) {
            return res.status(404).send(error_list_1.ErrorList["SUPPLIER_ALREADY_EXIST"]);
        }
        else {
            new supplier_model_1.default({
                name: name,
                address: address,
                email: email,
                phoneNumber: phone,
                npwp: npwp,
                createdBy: userID,
            })
                .create()
                .then((result) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on creating supplier ${error}`,
                    tag: "Supplier",
                    type: logger_interface_1.LoggerType.error,
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    });
};
SupplierController.fetch = (req, res) => {
    const keyword = req.query.keyword;
    const page = !req.query.page ? 1 : parseInt(req.query.page);
    supplier_model_1.default.fetch({
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
            message: `Error on fetching supplier ${error}`,
            tag: "Supplier",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
SupplierController.fetchByID = (req, res) => {
    const id = req.params.id;
    supplier_model_1.default.fetchByID(id)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching supplier ${error}`,
            tag: "Supplier",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
SupplierController.fetchAutocomplete = (req, res) => {
    const keyword = req.query.keyword;
    supplier_model_1.default.fetchAutocomplete(keyword)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching supplier autocomplete ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Supplier",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
SupplierController.update = (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const address = req.body.address;
    const email = req.body.email;
    const phone = req.body.phone;
    const npwp = req.body.npwp;
    const userID = req.body.userID;
    supplier_model_1.default.preUpdate({
        id: id,
        name: name,
    }).then((validation) => {
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["SUPPLIER_ALREADY_EXIST"]);
        }
        else {
            new supplier_model_1.default({
                id: id,
                name: name,
                address: address,
                email: email,
                phoneNumber: phone,
                npwp: npwp,
                createdBy: userID,
            })
                .update()
                .then((result) => {
                return res.status(200).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on updating supplier ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "Supplier",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    });
};
SupplierController.delete = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    supplier_model_1.default.preDelete(id)
        .then((validation) => {
        if (!validation) {
            return res.status(404).send(error_list_1.ErrorList["SUPPLIER_NOT_FOUND"]);
        }
        else {
            supplier_model_1.default.deleteByID(id, userID)
                .then((result) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on deleting supplier ${error}`,
                    tag: "Supplier",
                    type: logger_interface_1.LoggerType.error,
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on pre-deleting supplier ${error}`,
            tag: "Supplier",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = SupplierController;
//# sourceMappingURL=supplier.controller.js.map