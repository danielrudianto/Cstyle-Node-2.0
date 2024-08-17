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
class MembershipModelModel {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.code = data.code;
        this.point = data.point;
        this.email = data.email;
        this.phoneNumber = data.phoneNumber;
        this.nationality = data.nationality;
        this.language = data.language;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.birthday = data.birthday;
        this.storeID = data.storeID;
    }
    create() {
        return conn.model("memberships").create({
            name: this.name,
            code: this.code,
            point: this.point,
            email: this.email,
            phoneNumber: this.phoneNumber,
            nationality: this.nationality,
            language: this.language,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
        });
    }
    update() {
        return conn.model("memberships").findByIdAndUpdate(this.id, {
            name: this.name,
            point: this.point,
            email: this.email,
            phoneNumber: this.phoneNumber,
            nationality: this.nationality,
            language: this.language,
        });
    }
    static fetch(data) {
        return Promise.all([
            conn
                .model("memberships")
                .find({
                $or: [
                    {
                        name: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        code: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        nationality: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                ],
            })
                .populate("storeID", "name")
                .sort({ name: 1 })
                .limit(20)
                .skip((data.page - 1) * 20),
            conn.model("memberships").countDocuments({
                $or: [
                    {
                        name: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        code: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                    {
                        nationality: {
                            $regex: data.keyword,
                            $options: "i",
                        },
                    },
                ],
            }),
        ]);
    }
    static fetchByID(id) {
        return conn.model("memberships").findById(id).populate("storeID", "name");
    }
    static fetchByIDs(ids) {
        return conn.model("memberships").find({
            code: {
                $in: ids,
            },
        });
    }
    static count() {
        return Promise.all([
            conn.model("memberships").aggregate([
                {
                    $group: {
                        _id: "$storeID",
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $lookup: {
                        from: "stores",
                        localField: "_id",
                        foreignField: "_id",
                        as: "store",
                    },
                },
                {
                    $unwind: {
                        path: "$store",
                    },
                },
            ]),
            conn.model("memberships").aggregate([
                {
                    $group: {
                        _id: "$nationality",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),
        ]);
    }
    static countNewMembers(storeID = null) {
        if (storeID == null) {
            return conn.model("memberships").countDocuments({
                createdAt: {
                    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            });
        }
        else {
            return conn.model("memberships").countDocuments({
                storeID: storeID,
                createdAt: {
                    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            });
        }
    }
    static countMembers(storeID = null) {
        if (storeID == null) {
            return conn.model("memberships").countDocuments();
        }
        else {
            return conn.model("memberships").countDocuments({
                storeID: storeID,
            });
        }
    }
    static updatePoint(memberID, point) {
        return conn.model("memberships").findByIdAndUpdate(memberID, {
            $inc: {
                point: point,
            },
        });
    }
    static fetchByCode(code) {
        return conn.model("memberships").findOne({
            code: code,
        });
    }
    static preCreate(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield conn.model("memberships").countDocuments({
                code: code,
            });
            return count == 0;
        });
    }
    static preUpdate(id) {
        return conn.model("memberships").findById(id);
    }
}
exports.default = MembershipModelModel;
//# sourceMappingURL=membership.model.js.map