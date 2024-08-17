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
class UserSalesModel {
    constructor(name, _id) {
        this.name = name;
        this._id = _id;
    }
    static fetchAutocomplete(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield conn.model("users").find({
                isActive: true,
                accessLevel: 2,
                name: {
                    $regex: new RegExp(keyword, "i"),
                },
            });
            return users.map((x) => {
                return {
                    name: x.name,
                    _id: x._id.toString(),
                };
            });
        });
    }
}
exports.default = UserSalesModel;
//# sourceMappingURL=user-sales.model.js.map