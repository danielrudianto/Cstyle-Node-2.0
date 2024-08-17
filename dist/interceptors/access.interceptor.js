"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
const error_list_1 = require("../data/error-list");
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
class AccessInterceptor {
}
AccessInterceptor.salesRequired = (req, res, next) => {
    const userID = req.body.userID;
    app_1.redisClient
        .get(`users:${userID}`)
        .then((user) => {
        if (user == null) {
            throw Error(error_list_1.ErrorList["USER_NOT_FOUND"]);
        }
        else {
            const parsedUser = JSON.parse(user);
            if (parsedUser.accessLevel < 2) {
                throw Error(error_list_1.ErrorList["ACCESS_DENIED"]);
            }
            else {
                next();
            }
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user ${error}`,
            tag: "Access Interceptor",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
AccessInterceptor.supervisorRequired = (req, res, next) => {
    const userID = req.body.userID;
    app_1.redisClient
        .get(`users:${userID}`)
        .then((user) => {
        if (user == null) {
            throw Error(error_list_1.ErrorList["USER_NOT_FOUND"]);
        }
        else {
            const parsedUser = JSON.parse(user);
            if (parsedUser.accessLevel < 3) {
                throw Error(error_list_1.ErrorList["ACCESS_DENIED"]);
            }
            else {
                next();
            }
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user ${error}`,
            tag: "Access Interceptor",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
AccessInterceptor.administratorRequired = (req, res, next) => {
    const userID = req.body.userID;
    app_1.redisClient
        .get(`users:${userID}`)
        .then((user) => {
        if (user == null) {
            throw Error(error_list_1.ErrorList["USER_NOT_FOUND"]);
        }
        else {
            const parsedUser = JSON.parse(user);
            if (parsedUser.accessLevel < 4) {
                throw Error(error_list_1.ErrorList["ACCESS_DENIED"]);
            }
            else {
                next();
            }
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user ${error}`,
            tag: "Access Interceptor",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = AccessInterceptor;
//# sourceMappingURL=access.interceptor.js.map