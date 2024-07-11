import MembershipPointModelModel from "../models/point.model";
import { Request, Response } from "express";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { ErrorList } from "../data/error-list";
import { redisClient } from "../app";

class MembershipPointController {
  static fetchCurrent = async (req: Request, res: Response) => {
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

  static fetch = (req: Request, res: Response) => {
    const page = !req.query.page ? 1 : parseInt(req.query.page.toString());
    MembershipPointModelModel.fetch(page)
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching conversion ${error}`,
          tag: "Membership",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static create = (req: Request, res: Response) => {
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
}
``;
export default MembershipPointController;
