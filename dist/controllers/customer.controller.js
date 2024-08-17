"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_list_1 = require("../data/error-list");
const logger_interface_1 = require("../interfaces/logger.interface");
const customer_model_1 = __importDefault(require("../models/customer.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
class CustomerController {
}
CustomerController.create = (req, res) => {
    const name = req.body.name;
    const userID = req.body.userID;
    const address = req.body.address;
    const type = req.body.type;
    const phone = req.body.phone;
    const email = req.body.email;
    const npwp = req.body.npwp;
    new customer_model_1.default({
        name: name,
        address: address,
        type: type,
        phone: phone,
        email: email,
        npwp: npwp,
        createdBy: userID,
        createdAt: new Date(),
    })
        .create()
        .then((result) => {
        return res.status(201).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on creating customer ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Customer",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
CustomerController.updateV2 = (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const address = req.body.address;
    const type = req.body.type;
    const phone = req.body.phone;
    const email = req.body.email;
    const npwp = req.body.npwp;
    customer_model_1.default.fetchByID(id).then((customer) => {
        if (!customer) {
            return res.status(404).send(error_list_1.ErrorList["CUSTOMER_NOT_FOUND"]);
        }
        else if (customer.isDelete) {
            return res.status(404).send(error_list_1.ErrorList["CUSTOMER_NOT_FOUND"]);
        }
        else {
            new customer_model_1.default({
                id: id,
                name: name,
                address: address,
                type: type,
                phone: phone,
                email: email,
                npwp: npwp,
            })
                .update()
                .then((result) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on creating customer ${error}`,
                    tag: "Customer",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    });
};
CustomerController.deleteByID = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    customer_model_1.default.fetchByID(id).then((customer) => {
        if (!customer || customer.isDelete) {
            return res.status(404).send(error_list_1.ErrorList["CUSTOMER_NOT_FOUND"]);
        }
        else {
            customer_model_1.default.deleteByID(id, userID)
                .then((result) => {
                return res.status(200).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on deleting customer ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "Customer",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    });
};
CustomerController.fetchV2 = (req, res) => {
    var _a, _b;
    const keyword = (_b = (_a = req.query.keyword) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "";
    const page = req.query.page == undefined ? 1 : parseInt(req.query.page.toString());
    customer_model_1.default.fetchV2({
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
            message: `Error on fetching customer ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Customer",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
CustomerController.fetchAutocompleteBulk = (req, res) => {
    const keyword = req.query.keyword;
    customer_model_1.default.fetchAutocomplete(keyword, "bulk")
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching customer ${error}`,
            tag: "Customer",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
CustomerController.fetchAutocompleteConsignment = (req, res) => {
    const keyword = req.query.keyword;
    customer_model_1.default.fetchAutocomplete(keyword, "consignment")
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching customer ${error}`,
            tag: "Customer",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
CustomerController.fetchByID = (req, res) => {
    const id = req.params.id;
    customer_model_1.default.fetchByID(id)
        .then((customer) => {
        if (!customer) {
            return res.status(404).send(error_list_1.ErrorList["CUSTOMER_NOT_FOUND"]);
        }
        else {
            return res.status(200).send(customer);
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching customer ${error}`,
            tag: "Customer",
            type: logger_interface_1.LoggerType.error,
        }).log();
    });
};
exports.default = CustomerController;
//# sourceMappingURL=customer.controller.js.map