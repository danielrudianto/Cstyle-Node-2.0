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
const point_model_1 = __importDefault(require("../models/point.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const logger_interface_1 = require("../interfaces/logger.interface");
const error_list_1 = require("../data/error-list");
const app_1 = require("../app");
class MembershipPointController {
}
_a = MembershipPointController;
MembershipPointController.fetchCurrent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    point_model_1.default.fetchCurrentConversion()
        .then((result) => {
        return res.status(200).send(result);
    })
        .catch((error) => {
        new logger_utils_1.default({
            type: logger_interface_1.LoggerType.error,
            message: error.message,
            tag: "Membership point",
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
});
MembershipPointController.fetch = (req, res) => {
    const page = !req.query.page ? 1 : parseInt(req.query.page.toString());
    point_model_1.default.fetch(page)
        .then(([result, count]) => {
        return res.status(200).send({
            data: result,
            count: count,
        });
    })
        .catch((error) => {
        new logger_utils_1.default({
            message: `Error on fetching conversion ${error}`,
            tag: "Membership",
            type: logger_interface_1.LoggerType.error,
        }).log();
        return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
    });
};
MembershipPointController.create = (req, res) => {
    const conversion = req.body.conversion;
    const userID = req.body.userID;
    point_model_1.default.preCreate(conversion).then((validation) => {
        if (!validation) {
            return res.status(400).send(error_list_1.ErrorList["BAD_REQUEST"]);
        }
        else {
            new point_model_1.default({
                conversion: conversion,
                createdBy: userID,
            })
                .create()
                .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                yield app_1.redisClient.set("conversion", conversion);
                return res.status(201).send(result);
            }))
                .catch((error) => {
                new logger_utils_1.default({
                    type: logger_interface_1.LoggerType.error,
                    message: `Error on updating membership point: ${error.message}`,
                    tag: "Membership point",
                }).log();
                return res.status(500).send(error);
            });
        }
    });
};
``;
exports.default = MembershipPointController;
//# sourceMappingURL=membership-point.controller.js.map