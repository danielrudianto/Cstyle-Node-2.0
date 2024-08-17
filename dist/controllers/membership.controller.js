"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const error_list_1 = require("../data/error-list");
const membership_model_1 = __importDefault(require("../models/membership.model"));
class MembershipController {
}
MembershipController.fetch = (req, res) => {
    const keyword = req.query.keyword;
    const page = !req.query.page ? 1 : parseInt(req.query.page.toString());
    membership_model_1.default.fetch({
        keyword: keyword,
        page: page,
    })
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching memberships: ${error.message}`,
            tag: "Membership",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
MembershipController.fetchByID = (req, res) => {
    const id = req.params.id;
    membership_model_1.default.fetchByID(id)
        .then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["MEMBER_NOT_FOUND"]);
        }
        else {
            return res.status(200).send(result);
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching membership by id: ${error}`,
            type: logger_interface_1.LoggerType.error,
            tag: "Membership",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
MembershipController.fetchByCode = (req, res) => {
    const code = req.params.membershipCode;
    membership_model_1.default.fetchByCode(code)
        .then((result) => {
        if (!result) {
            return res.status(404).send(error_list_1.ErrorList["MEMBER_NOT_FOUND"]);
        }
        else {
            return res.status(200).send(result);
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: `Error on fetching membership by8 code: ${error.message}`,
            tag: "Membership",
        }).log();
        return res.status(500).send(error);
    });
};
MembershipController.create = (req, res) => {
    const nationality = req.body.nationality;
    const name = req.body.name;
    const code = req.body.code;
    const phoneNumber = req.body.phoneNumber;
    const email = req.body.email;
    const language = req.body.language;
    const userID = req.body.userID;
    const storeID = req.body.storeID;
    const birthday = new Date(req.body.birthday);
    membership_model_1.default.preCreate(code).then((validation) => {
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["DUPLICATE_MEMBER_CODE"]);
        }
        else {
            new membership_model_1.default({
                code: code,
                name: name,
                nationality: nationality,
                language: language,
                email: email,
                phoneNumber: phoneNumber,
                createdBy: userID,
                storeID: storeID,
                birthday: birthday,
                point: 0,
            })
                .create()
                .then((result) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on creating membership: ${error.message}`,
                    tag: "Membership",
                }).log();
                return res.status(500).send(error);
            });
        }
    });
};
MembershipController.updateByID = (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const nationality = req.body.nationality;
    const phoneNumber = req.body.phoneNumber;
    const email = req.body.email;
    const birthday = req.body.birthday;
    const language = req.body.language;
    membership_model_1.default.preUpdate(id)
        .then((member) => {
        if (!member) {
            return res.status(404).send(error_list_1.ErrorList["MEMBER_NOT_FOUND"]);
        }
        else {
            new membership_model_1.default({
                id: id,
                name: name,
                nationality: nationality,
                phoneNumber: phoneNumber,
                email: email,
                birthday: birthday,
                point: member.point,
                storeID: member.storeID,
                createdBy: member.createdBy,
                code: member.code,
                language: language,
            })
                .update()
                .then((result) => {
                return res.status(201).send(result);
            })
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on updating membership: ${error.message}`,
                    tag: "Membership",
                }).log();
                return res.status(500).send(error);
            });
        }
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching member ${error}`,
            tag: "Memebership",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
exports.default = MembershipController;
//# sourceMappingURL=membership.controller.js.map