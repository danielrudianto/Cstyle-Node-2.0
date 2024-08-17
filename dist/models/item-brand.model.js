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
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const migration_model_1 = __importDefault(require("./migration.model"));
const conn = (0, connector_utils_1.connectionFactory)();
class ItemBrandModelModel {
    constructor(data) {
        this.name = data.name;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.id = data.id;
    }
    create() {
        return conn.model("itembrands").create({
            name: this.name,
            createdBy: this.createdBy,
            createdAt: new Date(),
        });
    }
    update() {
        return Promise.all([
            conn.model("itembrands").updateOne({
                _id: this.id,
            }, {
                name: this.name,
            }),
            migration_model_1.default.updateProductBrand({
                id: this.id,
                name: this.name,
            }),
        ]);
    }
    delete() {
        return conn.model("itembrands").updateOne({
            _id: this.id,
        }, {
            isDelete: true,
            deletedAt: new Date(),
            deletedBy: this.createdBy,
        });
    }
    static fetchByID(id) {
        return conn.model("itembrands").findById(id);
    }
    static count() {
        return conn.model("itembrands").countDocuments({
            isDelete: false,
        });
    }
    static preCreate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield conn.model("itembrands").countDocuments({
                    name: data.name,
                    is_delete: false,
                });
                return count == 0;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static preUpdate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield conn.model("itembrands").findById(data.id);
                return count == null ? false : count.isDelete ? false : true;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static preDelete(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield conn.model("itembrands").findById(data.id);
                return count != null;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static fetch(data) {
        return conn
            .model("itembrands")
            .find(data.keyword == ""
            ? {
                isDelete: false,
            }
            : {
                isDelete: false,
                name: {
                    $regex: new RegExp(data.keyword, "i"),
                },
            })
            .sort({
            name: 1,
        })
            .skip((data.page - 1) * 20)
            .limit(20)
            .populate("_id name createdBy createdAt isDelete deletedBy deletedAt");
    }
    static fetchV2(data) {
        return Promise.all([
            conn
                .model("itembrands")
                .find({
                isDelete: false,
                name: {
                    $regex: new RegExp(data.keyword, "i"),
                },
            })
                .sort({
                name: 1,
            })
                .skip((data.page - 1) * 20)
                .limit(20)
                .populate("_id name createdBy createdAt isDelete deletedBy deletedAt"),
            conn.model("itembrands").countDocuments({
                isDelete: false,
                name: {
                    $regex: new RegExp(data.keyword, "i"),
                },
            }),
        ]);
    }
    static fetchAutocomplete(keyword) {
        return conn
            .model("itembrands")
            .find(keyword == ""
            ? {
                isDelete: false,
            }
            : {
                isDelete: false,
                name: {
                    $regex: new RegExp(keyword, "i"),
                },
            }, {
            limit: 5,
        })
            .populate("_id name")
            .sort({ name: 1 });
    }
}
exports.default = ItemBrandModelModel;
//# sourceMappingURL=item-brand.model.js.map