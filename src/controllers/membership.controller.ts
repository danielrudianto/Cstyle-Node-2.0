import { Request, Response } from "express";
import MembershipPointModelModel from "../models/point.model";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { ErrorList } from "../data/error-list";
import { redisClient } from "../app";
import MembershipModelModel from "../models/membership.model";

class MembershipController {
  static fetchConversion = async (req: Request, res: Response) => {
    MembershipPointModelModel.fetchCurrentConversion()
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: error.message,
          tag: "Membership point",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static createConversion = (req: Request, res: Response) => {
    const conversion = req.body.conversion;
    const userID = req.body.userID;
    MembershipPointModelModel.preCreate(conversion).then((validation) => {
      if (!validation) {
        return res.status(400).send(ErrorList["BAD_REQUEST"]);
      } else {
        new MembershipPointModelModel({
          conversion: conversion,
          createdBy: userID,
        })
          .create()
          .then(async (result) => {
            await redisClient.set("conversion", conversion);
            return res.status(201).send(result);
          })
          .catch((error) => {
            new LoggerHelper({
              type: LoggerType.error,
              message: `Error on updating membership point: ${error.message}`,
              tag: "Membership point",
            }).log();
            return res.status(500).send(error);
          });
      }
    });
  };

  static fetchByCode = (req: Request, res: Response) => {
    const code = req.params.membershipCode;
    console.log(code);
    MembershipModelModel.fetchByCode(code)
      .then((result) => {
        console.log(result);
        if (!result) {
          return res.status(404).send(ErrorList["MEMBER_NOT_FOUND"]);
        } else {
          return res.status(200).send(result);
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching membership point: ${error.message}`,
          tag: "Membership point",
        }).log();
        return res.status(500).send(error);
      });
  };
}

export default MembershipController;
