"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const JWT = __importStar(require("jsonwebtoken"));
const app_1 = require("../app");
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class AuthInterceptor {
}
AuthInterceptor.intercept = (req, res, next) => {
    if (req.headers["authorization"] == undefined ||
        req.headers["authorization"] == null) {
        return res.status(401).send("Token unrecognized.");
    }
    const bearerToken = req.headers["authorization"].toString();
    const componentToken = bearerToken.split(" ");
    if (componentToken.length == 2) {
        const token = componentToken[1];
        try {
            const decoded = JWT.verify(token, process.env.AUTHORIZATION_KEY);
            const userID = decoded.id;
            app_1.redisClient.get(`users:${userID}`).then((user) => {
                if (!user) {
                    return res.status(401).send("Token unrecognized.");
                }
                const parsedUser = JSON.parse(user);
                if (parsedUser.isActive == false) {
                    return res.status(401).send("User is inactive.");
                }
                req.body.userID = userID;
                next();
            });
        }
        catch (error) {
            console.error(`[error]: Error on verifying token: ${error}`);
            return res.status(401).send("Token already expired.");
        }
    }
    else {
        return res.status(401).send("Token unrecognized.");
    }
};
AuthInterceptor.anyIntercept = (req, res, next) => {
    if (req.headers["authorization"] == undefined ||
        req.headers["authorization"] == null) {
        const storeUID = req.headers["store"];
        if (storeUID == undefined || storeUID == null || storeUID == "") {
            return res.status(401).send("Token unrecognized.");
        }
        else {
            const promises = [];
            const formattedUID = storeUID.toString().substring(0, 8) +
                "-" +
                storeUID.toString().substring(8, 12) +
                "-" +
                storeUID.toString().substring(12, 16) +
                "-" +
                storeUID.toString().substring(16, 20) +
                "-" +
                storeUID.toString().substring(20, 32);
            const employeeCode = req.headers["employee-code"];
            Promise.all([
                conn.model("stores").findOne({
                    code: formattedUID,
                    isActive: true,
                }),
                employeeCode != undefined && employeeCode != null
                    ? conn.model("users").findOne({
                        code: employeeCode,
                        isActive: true,
                    })
                    : Promise.resolve(null),
            ])
                .then(([store, user]) => {
                if (!store) {
                    return res.status(401).send("Token unrecognized.");
                }
                else {
                    req.body.storeID = store._id;
                    if (employeeCode != undefined && employeeCode != null) {
                        if (!user) {
                            return res.status(401).send("Token unrecognized.");
                        }
                        else {
                            req.body.employeeID = user._id;
                            next();
                        }
                    }
                    else {
                        next();
                    }
                }
            })
                .catch((error) => {
                console.error(`[error]: Error on verifying token: ${error}`);
                return res.status(401).send("Token unrecognized.");
            });
        }
    }
    else {
        const bearerToken = req.headers["authorization"].toString();
        const componentToken = bearerToken.split(" ");
        if (componentToken.length == 2) {
            const token = componentToken[1];
            try {
                const decoded = JWT.verify(token, process.env.AUTHORIZATION_KEY);
                const userID = decoded.id;
                req.body.userID = userID;
                next();
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
exports.default = AuthInterceptor;
//# sourceMappingURL=auth.interceptor.js.map