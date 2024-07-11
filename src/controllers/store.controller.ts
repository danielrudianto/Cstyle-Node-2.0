import { Request, Response } from "express";
import StoreModelModel from "../models/store.model";
import { ErrorList } from "../data/error-list";
import { v4 } from "uuid";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { redisClient } from "../app";

class StoreController {
  static create = (req: Request, res: Response) => {
    const name = req.body.name;
    const address = req.body.address;
    const phoneNumber = req.body.phoneNumber;
    const prefix = req.body.prefix;
    const code = req.body.code;
    const userID = req.body.userID;

    StoreModelModel.preCreate({
      name: name,
      address: address,
      phoneNumber: phoneNumber,
      prefix: prefix,
      code: code,
    })
      .then((validation) => {
        if (!validation) {
          return res.status(400).send(ErrorList["STORE_ALREADY_EXIST"]);
        } else {
          new StoreModelModel({
            name: name,
            address: address,
            phoneNumber: phoneNumber,
            prefix: prefix,
            code: code,
            createdBy: userID,
          })
            .create()
            .then((result) => {
              return res.status(201).send(result);
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on creating store ${error}`,
                type: LoggerType.error,
                tag: "Store",
              }).log();
              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on pre-creating store ${error}`,
          type: LoggerType.error,
          tag: "Store",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetch = (req: Request, res: Response) => {
    const keyword = req.query.keyword as string;
    const page = !req.query.page ? 1 : parseInt(req.query.page as string);
    StoreModelModel.fetch({
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
        new LoggerHelper({
          message: `Error on fetching store ${error}`,
          type: LoggerType.error,
          tag: "Store",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    StoreModelModel.fetchByID(id)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching store ${error}`,
          type: LoggerType.error,
          tag: "Store",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchAutocomplete = (req: Request, res: Response) => {
    const keyword = req.query.keyword as string;
    StoreModelModel.fetchAutocomplete(keyword)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching store autocomplete ${error}`,
          tag: "Store",
          type: LoggerType.error,
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchOthers = (req: Request, res: Response) => {
    const storeID = req.body.storeID;
    StoreModelModel.fetchOthers(storeID)
      .then((result) => {
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
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching other stores ${error}`,
          type: LoggerType.error,
          tag: "Store",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static updateByID = (req: Request, res: Response) => {
    const name = req.body.name;
    const address = req.body.address;
    const phoneNumber = req.body.phoneNumber;
    const prefix = req.body.prefix;
    const id = req.body.id;
    const userID = req.body.userID;

    StoreModelModel.preUpdate({
      name: name,
      prefix: prefix,
      id: id,
    })
      .then((validation) => {
        if (!validation) {
          return res.status(400).send(ErrorList["STORE_ALREADY_EXIST"]);
        } else {
          new StoreModelModel({
            name: name,
            address: address,
            phoneNumber: phoneNumber,
            prefix: prefix,
            id: id,
            createdBy: userID,
          })
            .update()
            .then((result) => {
              return res.status(200).send(result);
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on updating store ${error}`,
                type: LoggerType.error,
                tag: "Store",
              }).log();
              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on pre-updating store ${error}`,
          type: LoggerType.error,
          tag: "Store",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static deleteByID = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;
    StoreModelModel.deleteByID(id, userID)
      .then(async (result) => {
        await redisClient.del(`store:${id}`);

        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on deleting store ${error}`,
          type: LoggerType.error,
          tag: "Store",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default StoreController;
