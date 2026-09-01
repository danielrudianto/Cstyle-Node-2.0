import { Request, Response } from "express";
import { redisClient } from "../app";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { MembershipRepository } from "../repositories/membership.repository";
import LoggerHelper from "../utils/logger.helper";

/**
 * Lapisan HTTP untuk kurs penukaran poin.
 *
 * Kurs yang berlaku disalin ke Redis dengan kunci "conversion", karena
 * StockService... lebih tepatnya WorkerController.createBill() membacanya dari
 * sana setiap kali menghitung poin sebuah nota. Kalau kunci itu belum pernah
 * ditulis, Number(null) menghasilkan 0 dan anggota tidak mendapat poin sama
 * sekali — tanpa galat apa pun. Jadi kurs pertama HARUS dibuat lewat endpoint
 * ini, bukan langsung ke database.
 */
export class MembershipPointController {
  private membershipRepository: MembershipRepository;

  constructor(membershipRepository: MembershipRepository) {
    this.membershipRepository = membershipRepository;
  }

  fetchCurrent = async (req: Request, res: Response) => {
    try {
      const result = await this.membershipRepository.fetchCurrentConversion();
      return res.status(200).send(result);
    } catch (error: any) {
      new LoggerHelper({
        type: LoggerType.error,
        message: error?.message,
        tag: "Membership point",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.membershipRepository.fetchConversions(
        !req.query.page ? 1 : parseInt(req.query.page.toString())
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching conversion ${error}`,
        tag: "Membership",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const sama = await this.membershipRepository.isConversionUnchanged(
        req.body.conversion
      );

      if (sama) {
        return res.status(400).send(ErrorList["BAD_REQUEST"]);
      }

      const result = await this.membershipRepository.createConversion({
        conversion: req.body.conversion,
        createdBy: req.body.userID,
      });

      await redisClient.set("conversion", req.body.conversion);

      return res.status(201).send(result);
    } catch (error: any) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on updating membership point: ${error?.message}`,
        tag: "Membership point",
      }).log();

      return res.status(500).send(error);
    }
  };
}

export default MembershipPointController;
