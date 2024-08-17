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
const error_list_1 = require("../data/error-list");
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class StoreModelModel {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.prefix = data.prefix;
        this.address = data.address;
        this.phoneNumber = data.phoneNumber;
        this.code = data.code;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
    }
    create() {
        return conn.model("stores").create({
            name: this.name,
            prefix: this.prefix,
            address: this.address,
            phoneNumber: this.phoneNumber,
            code: this.code,
            createdBy: this.createdBy,
            createdAt: new Date(),
        });
    }
    update() {
        return conn.model("stores").findByIdAndUpdate(this.id, {
            name: this.name,
            prefix: this.prefix,
            address: this.address,
            phoneNumber: this.phoneNumber,
            code: this.code,
        });
    }
    static fetch(data) {
        return Promise.all([
            conn
                .model("stores")
                .find({
                $or: [
                    {
                        name: {
                            $regex: new RegExp(data.keyword, "i"),
                        },
                    },
                    {
                        prefix: {
                            $regex: new RegExp(data.keyword, "i"),
                        },
                    },
                    {
                        phoneNumber: {
                            $regex: new RegExp(data.keyword, "i"),
                        },
                    },
                    {
                        address: {
                            $regex: new RegExp(data.keyword, "i"),
                        },
                    },
                ],
            })
                .skip((data.page - 1) * 20)
                .limit(20)
                .sort({ name: 1 }),
            conn.model("stores").countDocuments({
                $or: [
                    {
                        name: {
                            $regex: new RegExp(data.keyword, "i"),
                        },
                    },
                    {
                        prefix: {
                            $regex: new RegExp(data.keyword, "i"),
                        },
                    },
                    {
                        phoneNumber: {
                            $regex: new RegExp(data.keyword, "i"),
                        },
                    },
                    {
                        address: {
                            $regex: new RegExp(data.keyword, "i"),
                        },
                    },
                ],
            }),
        ]);
    }
    static fetchOthers(storeID) {
        return storeID == null
            ? conn
                .model("stores")
                .find({ isActive: true })
                .select("name address")
                .sort({
                name: 1,
            })
            : conn
                .model("stores")
                .find({
                _id: {
                    $ne: storeID,
                },
                isActive: true,
            })
                .select("name address")
                .sort({
                name: 1,
            });
    }
    static fetchByCode(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const store = yield conn
                .model("stores")
                .find({ code: code, isActive: true });
            if (store.length == 0) {
                throw Error(error_list_1.ErrorList["STORE_NOT_FOUND"]);
            }
            else {
                return new StoreModelModel(store[0]);
            }
        });
    }
    static fetchAutocomplete(keyword) {
        return conn.model("stores").find({
            name: {
                $regex: new RegExp(keyword, "i"),
            },
            isActive: true,
        });
    }
    static deleteByID(id, userID) {
        return conn.model("stores").findByIdAndUpdate(id, {
            isActive: false,
            deletedBy: userID,
            deletedAt: new Date(),
        });
    }
    static fetchByID(id) {
        return conn.model("stores").findById(id);
    }
    static preCreate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("stores").countDocuments({
                $or: [
                    {
                        name: data.name,
                    },
                    {
                        prefix: data.prefix,
                    },
                    {
                        code: data.code,
                    },
                ],
            });
            return count == 0;
        });
    }
    static preUpdate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("stores").countDocuments({
                $or: [
                    {
                        name: data.name,
                    },
                    {
                        prefix: data.prefix,
                    },
                ],
                _id: {
                    $ne: data.id,
                },
            });
            return count == 0;
        });
    }
}
exports.default = StoreModelModel;
//# sourceMappingURL=store.model.js.map