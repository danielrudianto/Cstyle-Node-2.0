import { Request, Response } from "express";
import { redisClient } from "../app";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { StoreRepository } from "../repositories/store.repository";
import LoggerHelper from "../utils/logger.helper";

/**
 * Lapisan HTTP untuk toko.
 */
export class StoreController {
  private storeRepository: StoreRepository;

  constructor(storeRepository: StoreRepository) {
    this.storeRepository = storeRepository;
  }

  create = async (req: Request, res: Response) => {
    try {
      const taken = await this.storeRepository.isTaken({
        name: req.body.name,
        address: req.body.address,
        phoneNumber: req.body.phoneNumber,
        prefix: req.body.prefix,
        code: req.body.code,
      });

      if (taken) {
        return res.status(400).send(ErrorList["STORE_ALREADY_EXIST"]);
      }

      const result = await this.storeRepository.create({
        name: req.body.name,
        address: req.body.address,
        phoneNumber: req.body.phoneNumber,
        prefix: req.body.prefix,
        code: req.body.code,
        createdBy: req.body.userID,
      });

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on creating store ${error}`,
        type: LoggerType.error,
        tag: "Store",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.storeRepository.fetch({
        keyword: req.query.keyword as string,
        page: !req.query.page ? 1 : parseInt(req.query.page as string),
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching store ${error}`,
        type: LoggerType.error,
        tag: "Store",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.storeRepository.fetchByID(req.params.id);

      /* Toko yang tidak ada dibalas 200 dengan badan null, seperti sebelumnya. */
      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching store ${error}`,
        type: LoggerType.error,
        tag: "Store",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchAutocomplete = async (req: Request, res: Response) => {
    try {
      const result = await this.storeRepository.fetchAutocomplete(
        req.query.keyword as string
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching store autocomplete ${error}`,
        tag: "Store",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Daftar toko lain, dengan "Office" disisipkan di depan.
   *
   * Kantor pusat bukan baris di koleksi `stores` — ia diwakili storeID null —
   * jadi datanya ditulis langsung di sini. Nama dan alamatnya tertanam di
   * kode; kalau kantornya pindah, baris ini yang harus diubah.
   */
  fetchOthers = async (req: Request, res: Response) => {
    try {
      const result = await this.storeRepository.fetchOthers(req.body.storeID);

      return res.status(200).send([
        {
          _id: null,
          name: "Office",
          address: "Jalan Raya Kerobokan no. 87A",
          phoneNumber: "0878-5426-8240",
          code: "",
        },
        ...result,
      ]);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching other stores ${error}`,
        type: LoggerType.error,
        tag: "Store",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  updateByID = async (req: Request, res: Response) => {
    try {
      const taken = await this.storeRepository.isTakenByOther({
        name: req.body.name,
        prefix: req.body.prefix,
        id: req.body.id,
      });

      if (taken) {
        return res.status(400).send(ErrorList["STORE_ALREADY_EXIST"]);
      }

      /*
        `code` sengaja tidak ikut diperbarui: kode lama tidak mengirimkannya,
        sehingga Mongoose melewatinya. Kode toko dipakai aplikasi kasir untuk
        mengenali dirinya, jadi mengubahnya di sini akan memutus perangkat yang
        sudah terpasang.
      */
      const result = await this.storeRepository.update({
        _id: req.body.id,
        name: req.body.name,
        address: req.body.address,
        phoneNumber: req.body.phoneNumber,
        prefix: req.body.prefix,
        createdBy: req.body.userID,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on updating store ${error}`,
        type: LoggerType.error,
        tag: "Store",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  deleteByID = async (req: Request, res: Response) => {
    try {
      const result = await this.storeRepository.delete(
        req.params.id,
        req.body.userID
      );

      /*
        Kunci cache yang dihapus berpola `store:<id>`, padahal tidak ada satu
        pun tempat di kode ini yang MENULIS kunci dengan pola itu —
        auth.interceptor mencari toko langsung ke MongoDB. Jadi penghapusan ini
        praktis tidak melakukan apa-apa. Dipertahankan apa adanya.
      */
      await redisClient.del(`store:${req.params.id}`);

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on deleting store ${error}`,
        type: LoggerType.error,
        tag: "Store",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default StoreController;
