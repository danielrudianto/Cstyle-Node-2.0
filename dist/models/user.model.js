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
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class UserModelModel {
    constructor(data) {
        this._id = data._id;
        this.name = data.name;
        this.password = data.password;
        this.username = data.username;
        this.isActive = data.isActive;
        this.accessLevel = data.accessLevel;
        this.code = data.code;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.deletedBy = data.deletedBy;
        this.deletedAt = data.deletedAt;
    }
    create() {
        return conn.model("users").create({
            name: this.name,
            password: this.password,
            username: this.username,
            isActive: this.isActive,
            accessLevel: this.accessLevel,
            code: this.code,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            deletedBy: this.deletedBy,
            deletedAt: this.deletedAt,
        });
    }
    update() {
        return conn.model("users").findByIdAndUpdate(this._id, {
            name: this.name,
            password: this.password,
            username: this.username,
            isActive: this.isActive,
            accessLevel: this.accessLevel,
            code: this.code,
        });
    }
    static fetch(data) {
        return Promise.all([
            conn
                .model("users")
                .find({
                $or: [
                    { username: RegExp(data.keyword, "i") },
                    { code: RegExp(data.keyword, "i") },
                    { name: RegExp(data.keyword, "i") },
                ],
            })
                .limit(20)
                .skip((data.page - 1) * 20)
                .sort({ name: 1 }),
            conn.model("users").countDocuments({
                $or: [
                    { username: RegExp(data.keyword, "i") },
                    { code: RegExp(data.keyword, "i") },
                    { name: RegExp(data.keyword, "i") },
                ],
            }),
        ]);
    }
    static fetchByID(id) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield conn.model("users").findById(id);
                if (!result)
                    throw new Error("User not found.");
                return new UserModelModel(result);
            }
            catch (error) {
                throw new Error((_a = error === null || error === void 0 ? void 0 : error.toString()) !== null && _a !== void 0 ? _a : "An unknown error occurred.");
            }
        });
    }
    static fetchByUsername(username) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield conn.model("users").findOne({ username });
                return result ? new UserModelModel(result) : null;
            }
            catch (error) {
                throw new Error((_a = error === null || error === void 0 ? void 0 : error.toString()) !== null && _a !== void 0 ? _a : "An unknown error occurred.");
            }
        });
    }
    static fetchSync() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield conn.model("users").find({
                    isActive: true,
                });
                return result.map((data) => new UserModelModel(data));
            }
            catch (error) {
                throw new Error((_a = error === null || error === void 0 ? void 0 : error.toString()) !== null && _a !== void 0 ? _a : "An unknown error occurred.");
            }
        });
    }
    static fetchInitial() {
        return __awaiter(this, void 0, void 0, function* () {
            return conn.model("users").find({ isActive: true });
        });
    }
    static deleteByID(id, userID) {
        return conn.model("users").findByIdAndUpdate(id, {
            isActive: false,
            deletedBy: userID,
            deletedAt: new Date(),
        });
    }
    static preCreate(username, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("users").countDocuments({
                $or: [{ username: username }, { code: code }],
            });
            return count == 0;
        });
    }
    static preUpdate(username, code, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("users").countDocuments({
                $or: [{ username: username }, { code: code }],
                _id: { $ne: id },
            });
            return count == 0;
        });
    }
}
exports.default = UserModelModel;
//# sourceMappingURL=user.model.js.map