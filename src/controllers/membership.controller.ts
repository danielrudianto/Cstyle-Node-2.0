import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { MembershipRepository } from "../repositories/membership.repository";
import LoggerHelper from "../utils/logger.helper";

/** Lapisan HTTP untuk keanggotaan. */
export class MembershipController {
  private membershipRepository: MembershipRepository;

  constructor(membershipRepository: MembershipRepository) {
    this.membershipRepository = membershipRepository;
  }

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.membershipRepository.fetch({
        keyword: req.query.keyword as string,
        page: !req.query.page ? 1 : parseInt(req.query.page.toString()),
      });

      return res.status(200).send(result);
    } catch (error: any) {
      new LoggerHelper({
        message: `Error on fetching memberships: ${error?.message}`,
        tag: "Membership",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.membershipRepository.fetchByID(req.params.id);
      if (!result) {
        return res.status(404).send(ErrorList["MEMBER_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching membership by id: ${error}`,
        type: LoggerType.error,
        tag: "Membership",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByCode = async (req: Request, res: Response) => {
    try {
      const result = await this.membershipRepository.fetchByCode(
        req.params.membershipCode
      );

      if (!result) {
        return res.status(404).send(ErrorList["MEMBER_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error: any) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching membership by code: ${error?.message}`,
        tag: "Membership",
      }).log();

      return res.status(500).send(error);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      if (await this.membershipRepository.isCodeTaken(req.body.code)) {
        return res.status(400).send(ErrorList["DUPLICATE_MEMBER_CODE"]);
      }

      /*
        `birthday` dan `storeID` diteruskan seperti sebelumnya, tetapi
        repository memang tidak menuliskannya — lihat catatan di
        membership.repository.ts.
      */
      const result = await this.membershipRepository.create({
        code: req.body.code,
        name: req.body.name,
        nationality: req.body.nationality,
        language: req.body.language,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        createdBy: req.body.userID,
        storeID: req.body.storeID,
        birthday: new Date(req.body.birthday),
        point: 0,
      });

      return res.status(201).send(result);
    } catch (error: any) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on creating membership: ${error?.message}`,
        tag: "Membership",
      }).log();

      return res.status(500).send(error);
    }
  };

  updateByID = async (req: Request, res: Response) => {
    try {
      const member = await this.membershipRepository.fetchByID(req.body.id);
      if (!member) {
        return res.status(404).send(ErrorList["MEMBER_NOT_FOUND"]);
      }

      /* Poin, toko, kode, dan pembuat diambil dari data lama — tidak bisa disunting. */
      const result = await this.membershipRepository.update({
        _id: req.body.id,
        name: req.body.name,
        nationality: req.body.nationality,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email,
        birthday: req.body.birthday,
        language: req.body.language,
        point: member.point,
        storeID: member.storeID,
        createdBy: member.createdBy,
        code: member.code,
      });

      return res.status(201).send(result);
    } catch (error: any) {
      new LoggerHelper({
        message: `Error on updating membership: ${error?.message}`,
        tag: "Membership",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default MembershipController;
