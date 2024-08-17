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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_list_1 = require("../data/error-list");
const connector_utils_1 = require("../utils/connector.utils");
const user_model_1 = __importDefault(require("../models/user.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const queue_utils_1 = require("../utils/queue.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class AuthController {
    static generateAccessToken(userID, name) {
        return jsonwebtoken_1.default.sign({
            id: userID,
            name: name,
        }, process.env.AUTHORIZATION_KEY, {
            expiresIn: "8h",
        });
    }
    static generateRefreshToken(userID) {
        return jsonwebtoken_1.default.sign({
            id: userID,
        }, process.env.REFRESH_AUTHORIZATION_KEY, {
            expiresIn: "7d",
        });
    }
}
_a = AuthController;
AuthController.login = (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    user_model_1.default.fetchByUsername(username)
        .then((user) => {
        if (user == null || !user.isActive) {
            return res.status(404).send(error_list_1.ErrorList["LOGIN_ERROR"]);
        }
        else {
            (0, bcrypt_1.compare)(password, user.password).then((validation) => __awaiter(void 0, void 0, void 0, function* () {
                if (!validation) {
                    return res.status(404).send(error_list_1.ErrorList["LOGIN_ERROR"]);
                }
                else {
                    yield queue_utils_1.queue.add("login", user._id);
                    const token = _a.generateAccessToken(user._id, user.name);
                    const refreshToken = _a.generateRefreshToken(user._id);
                    return res.status(200).send({
                        id: user._id,
                        name: user.name,
                        accessLevel: user.accessLevel,
                        token: token,
                        refreshToken: refreshToken,
                    });
                }
            }));
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching user ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Authentication",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
AuthController.refreshToken = (req, res) => {
    if (req.headers["x-token"] == undefined || req.headers["x-token"] == null) {
        return res.status(401).send("Token unrecognized.");
    }
    else {
        const bearerToken = req.headers["x-token"].toString();
        const componentToken = bearerToken.split(" ");
        if (componentToken.length == 2) {
            const token = componentToken[1];
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.REFRESH_AUTHORIZATION_KEY);
                const userID = decoded.id;
                conn
                    .model("users")
                    .findById(userID)
                    .then((user) => {
                    if (user == null || !user.isActive) {
                        return res.status(400).send("User not recognized");
                    }
                    else {
                        return res.status(200).send({
                            token: jsonwebtoken_1.default.sign({
                                id: user.id,
                                name: user.name,
                            }, process.env.AUTHORIZATION_KEY, {
                                expiresIn: "8h",
                            }),
                        });
                    }
                });
            }
            catch (error) {
                return res.status(401).send("Token already expired.");
            }
        }
        else {
            return res.status(401).send("Token unrecognized.");
        }
    }
};
AuthController.fetchProfile = (req, res) => {
    const userID = req.body.userID;
    conn
        .model("users")
        .findById(userID)
        .then((user) => {
        if (!user) {
            return res.status(404).send(error_list_1.ErrorList["USER_NOT_FOUND"]);
        }
        if (!user.isActive) {
            return res.status(404).send(error_list_1.ErrorList["USER_NOT_FOUND"]);
        }
        return res.status(200).send({
            id: user.id,
            name: user.name,
            accessLevel: user.accessLevel,
            code: user.code,
            username: user.username,
            isActive: user.isActive,
            createdAt: user.createdAt,
        });
    });
};
AuthController.updatePassword = (req, res) => {
    const userID = req.body.userID;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    conn
        .model("users")
        .findById(userID)
        .then((user) => {
        (0, bcrypt_1.compare)(oldPassword, user.password)
            .then((value) => {
            if (!value) {
                return res.status(401).send("Invalid old password.");
            }
            (0, bcrypt_1.hash)(newPassword, 12)
                .then((hashedPassword) => {
                conn
                    .model("users")
                    .findByIdAndUpdate(userID, {
                    password: hashedPassword,
                })
                    .then(() => {
                    return res.status(201).send(user);
                })
                    .catch((error) => {
                    return res.status(500).send(error);
                });
            })
                .catch((error) => {
                console.error(`[error]: Error on hashing password: ${error}`);
                return res.status(500).send(error);
            });
        })
            .catch((error) => {
            console.error(`[error]: Error on comparing password: ${error}`);
            return res.status(401).send("Invalid old password.");
        });
    })
        .catch((error) => {
        console.error(`[error]: Error on finding user: ${error}`);
        return res.status(500).send(error);
    });
};
exports.default = AuthController;
//# sourceMappingURL=auth.controller.js.map