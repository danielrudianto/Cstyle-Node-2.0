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
class SupplierModelModel {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.address = data.address;
        this.phoneNumber = data.phoneNumber;
        this.npwp = data.npwp;
        this.email = data.email;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.isDelete = data.isDelete;
        this.deletedBy = data.deletedBy;
        this.deletedAt = data.deletedAt;
    }
    create() {
        return conn.model("suppliers").create({
            name: this.name,
            address: this.address,
            phoneNumber: this.phoneNumber,
            npwp: this.npwp,
            email: this.email,
            createdBy: this.createdBy,
            createdAt: new Date(),
        });
    }
    static fetch(data) {
        return Promise.all([
            conn
                .model("suppliers")
                .find({
                isDelete: false,
                $or: [
                    {
                        name: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        address: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        phoneNumber: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        npwp: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                ],
            })
                .skip((data.page - 1) * 20)
                .limit(20)
                .sort({ name: 1 }),
            conn.model("suppliers").countDocuments({
                isDelete: false,
                $or: [
                    {
                        name: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        address: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        phoneNumber: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        npwp: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                ],
            }),
        ]);
    }
    static fetchByID(id) {
        return conn.model("suppliers").findById(id);
    }
    static fetchAutocomplete(keyword) {
        return conn
            .model("suppliers")
            .find({
            name: {
                $regex: new RegExp(keyword, "i"),
            },
            isDelete: false,
        })
            .limit(5)
            .skip(0)
            .sort({ name: 1 });
    }
    update() {
        return conn.model("suppliers").findByIdAndUpdate(this.id, {
            name: this.name,
            address: this.address,
            phoneNumber: this.phoneNumber,
            npwp: this.npwp,
            email: this.email,
        });
    }
    static deleteByID(id, userID) {
        return conn.model("suppliers").findByIdAndUpdate(id, {
            isDelete: true,
            deletedBy: userID,
            deletedAt: new Date(),
        });
    }
    static preCreate(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("suppliers").countDocuments({
                name: name,
                isDelete: false,
            });
            return count === 0;
        });
    }
    static preUpdate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("suppliers").countDocuments({
                name: data.name,
                isDelete: false,
                _id: { $ne: data.id },
            });
            return count === 0;
        });
    }
    static preDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("suppliers").countDocuments({
                _id: id,
                isDelete: false,
            });
            return count === 1;
        });
    }
}
exports.default = SupplierModelModel;
//# sourceMappingURL=supplier.model.js.map