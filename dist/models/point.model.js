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
class MembershipPointModelModel {
    constructor(data) {
        this.id = data.id;
        this.conversion = data.conversion;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
    }
    create() {
        return conn.model("membership-points").create({
            conversion: this.conversion,
            createdBy: this.createdBy,
            createdAt: new Date(),
        });
    }
    static fetch(page) {
        return Promise.all([
            conn
                .model("membership-points")
                .find({})
                .populate("createdBy", "name")
                .sort({ createdAt: -1 })
                .limit(10)
                .skip((page - 1) * 10),
            conn.model("membership-points").countDocuments({}),
        ]);
    }
    static fetchCurrentConversion() {
        return conn.model("membership-points").findOne({}).sort({
            createdAt: -1,
        });
    }
    static preCreate(conversion) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentConversion = yield this.fetchCurrentConversion();
            if (currentConversion == null) {
                return true;
            }
            else if (currentConversion.conversion != conversion) {
                return true;
            }
            else {
                return false;
            }
        });
    }
}
exports.default = MembershipPointModelModel;
//# sourceMappingURL=point.model.js.map