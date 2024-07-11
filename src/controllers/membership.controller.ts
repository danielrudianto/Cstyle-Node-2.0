import { Request, Response } from "express";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { ErrorList } from "../data/error-list";
import MembershipModelModel from "../models/membership.model";

class MembershipController {
  static fetchByCode = (req: Request, res: Response) => {
    const code = req.params.membershipCode;
    MembershipModelModel.fetchByCode(code)
      .then((result) => {
        if (!result) {
          return res.status(404).send(ErrorList["MEMBER_NOT_FOUND"]);
        } else {
          return res.status(200).send(result);
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching membership by8 code: ${error.message}`,
          tag: "Membership",
        }).log();
        return res.status(500).send(error);
      });
  };

  static create = (req: Request, res: Response) => {
    const nationality = req.body.nationality;
    const name = req.body.name;
    const code = req.body.code;
    const phoneNumber = req.body.phoneNumber;
    const email = req.body.email;
    const language = req.body.language;
    const userID = req.body.userID;
    const storeID = req.body.storeID;
    const birthday = new Date(req.body.birthday);
    MembershipModelModel.preCreate(code).then((validation) => {
      if (!validation) {
        return res.status(400).send(ErrorList["DUPLICATE_MEMBER_CODE"]);
      } else {
        new MembershipModelModel({
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
            new LoggerHelper({
              type: LoggerType.error,
              message: `Error on creating membership: ${error.message}`,
              tag: "Membership",
            }).log();
            return res.status(500).send(error);
          });
      }
    });
  };
}

export default MembershipController;
