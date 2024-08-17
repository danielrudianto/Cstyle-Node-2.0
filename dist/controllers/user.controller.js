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
const bcrypt_1 = require("bcrypt");
const error_list_1 = require("../data/error-list");
const app_1 = require("../app");
const logger_interface_1 = require("../interfaces/logger.interface");
const user_model_1 = __importDefault(require("../models/user.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const user_sales_model_1 = __importDefault(require("../models/user-sales.model"));
const queue_utils_1 = require("../utils/queue.utils");
class UserController {
    static generateRandomPassword() {
        let password = "";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < 8) {
            password += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return password;
    }
}
_a = UserController;
UserController.create = (req, res) => {
    const name = req.body.name;
    const username = req.body.username;
    const accessLevel = req.body.accessLevel;
    const code = req.body.code;
    const createdBy = req.body.userID;
    user_model_1.default.preCreate(username, code)
        .then((validation) => {
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["USERNAME_ALREADY_EXISTS"]);
        }
        else {
            const password = _a.generateRandomPassword();
            (0, bcrypt_1.hash)(password, 12)
                .then((hashedPassword) => {
                new user_model_1.default({
                    name: name,
                    code: code,
                    username: username,
                    password: hashedPassword,
                    accessLevel: accessLevel,
                    createdBy: createdBy,
                    createdAt: new Date(),
                    isActive: true,
                })
                    .create()
                    .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                    yield app_1.redisClient.set(`users:${result._id}`, JSON.stringify(result));
                    yield queue_utils_1.queue.add("createUser", {
                        id: result._id,
                    });
                    return res.status(201).send({
                        password: password,
                    });
                }))
                    .catch((error) => {
                    new logger_utils_1.default({
                        message: `Error on creating user ${error}`,
                        type: logger_interface_1.LoggerType.error,
                        tag: "User",
                    }).log();
                    return res
                        .status(500)
                        .send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
                });
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on hashing user password ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "User",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on checking user ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "User",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
UserController.fetch = (req, res) => {
    const keyword = req.query.keyword == undefined || req.query.keyword == null
        ? ""
        : req.query.keyword.toString();
    const page = req.query.page == undefined || req.query.page == null
        ? 1
        : parseInt(req.query.page.toString());
    user_model_1.default.fetch({
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
            message: `Error on fetching user ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "User",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
UserController.fetchSales = (req, res) => {
    const keyword = req.query.keyword;
    user_sales_model_1.default.fetchAutocomplete(keyword)
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching sales user ${error}`,
            tag: "error",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error);
    });
};
UserController.fetchByID = (req, res) => {
    const id = req.params.id;
    user_model_1.default.fetchByID(id)
        .then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["USER_NOT_FOUND"]);
        }
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "User",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
UserController.updateByID = (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const username = req.body.username;
    const accessLevel = req.body.accessLevel;
    const code = req.body.code;
    user_model_1.default.preUpdate(username, code, id)
        .then((validation) => {
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["USERNAME_ALREADY_EXISTS"]);
        }
        else {
            new user_model_1.default({
                name: name,
                username: username,
                accessLevel: accessLevel,
                code: code,
                _id: id,
                isActive: true,
            })
                .update()
                .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                yield app_1.redisClient.set(`users:${result._id}`, JSON.stringify({
                    name: name,
                    username: username,
                    accessLevel: accessLevel,
                    code: code,
                    _id: id,
                    isActive: true,
                }));
                yield queue_utils_1.queue.add("updateUser", {
                    id: result._id,
                });
                return res.status(200).send(result);
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on updating user ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "User",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on pre updating user ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "User",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
UserController.resetPassword = (req, res) => {
    const userID = req.body.id;
    user_model_1.default.fetchByID(userID)
        .then((user) => {
        if (!user || !user.isActive) {
            return res.status(404).send(error_list_1.ErrorList["USER_NOT_FOUND"]);
        }
        else {
            const password = _a.generateRandomPassword();
            (0, bcrypt_1.hash)(password, 12)
                .then((hashedPassword) => {
                new user_model_1.default({
                    _id: userID,
                    password: hashedPassword,
                    name: user.name,
                    username: user.username,
                    isActive: user.isActive,
                    code: user.code,
                    accessLevel: user.accessLevel,
                })
                    .update()
                    .then((_) => {
                    return res.status(201).send({
                        password: password,
                    });
                })
                    .catch((error) => {
                    new logger_utils_1.default({
                        message: `Error on updating user ${error}`,
                        type: logger_interface_1.LoggerType.error,
                        tag: "User",
                    }).log();
                    return res
                        .status(500)
                        .send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
                });
            })
                .catch((error) => {
                new logger_utils_1.default({
                    message: `Error on hashing password ${error}`,
                    type: logger_interface_1.LoggerType.error,
                    tag: "User",
                }).log();
                return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "User",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
UserController.deleteByID = (req, res) => {
    const id = req.params.id;
    const userID = req.body.userID;
    user_model_1.default.deleteByID(id, userID)
        .then((result) => __awaiter(void 0, void 0, void 0, function* () {
        yield app_1.redisClient.del(`users:${result._id}`);
        yield queue_utils_1.queue.add("deleteUser", {
            id: result._id,
        });
        return res.status(200).send(result);
    }))
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on deleting user ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "User",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
UserController.fetchByCode = (req, res) => {
};
exports.default = UserController;
//# sourceMappingURL=user.controller.js.map