import { Request, Response } from "express";
import SupplierModelModel from "../models/supplier.model";
import { ErrorList } from "../data/error-list";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";

class SupplierController {
  static create = (req: Request, res: Response) => {
    const name = req.body.name;
    const address = req.body.address;
    const email = req.body.email;
    const phone = req.body.phone;
    const npwp = req.body.npwp;
    const userID = req.body.userID;

    SupplierModelModel.preCreate(name).then((validation) => {
      if (!validation) {
        return res.status(404).send(ErrorList["SUPPLIER_ALREADY_EXIST"]);
      } else {
        new SupplierModelModel({
          name: name,
          address: address,
          email: email,
          phoneNumber: phone,
          npwp: npwp,
          createdBy: userID,
        })
          .create()
          .then((result) => {
            return res.status(201).send(result);
          })
          .catch((error) => {
            new LoggerHelper({
              message: `Error on creating supplier ${error}`,
              tag: "Supplier",
              type: LoggerType.error,
            }).log();
            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      }
    });
  };

  static fetch = (req: Request, res: Response) => {
    const keyword = req.query.keyword as string;
    const page = !req.query.page ? 1 : parseInt(req.query.page as string);
    SupplierModelModel.fetch({
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
          message: `Error on fetching supplier ${error}`,
          tag: "Supplier",
          type: LoggerType.error,
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    SupplierModelModel.fetchByID(id)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching supplier ${error}`,
          tag: "Supplier",
          type: LoggerType.error,
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchAutocomplete = (req: Request, res: Response) => {
    const keyword = req.query.keyword as string;
    SupplierModelModel.fetchAutocomplete(keyword)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching supplier autocomplete ${error}`,
          type: LoggerType.error,
          tag: "Supplier",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static update = (req: Request, res: Response) => {
    const id = req.body.id;
    const name = req.body.name;
    const address = req.body.address;
    const email = req.body.email;
    const phone = req.body.phone;
    const npwp = req.body.npwp;
    const userID = req.body.userID;

    SupplierModelModel.preUpdate({
      id: id,
      name: name,
    }).then((validation) => {
      if (!validation) {
        return res.status(400).send(ErrorList["SUPPLIER_ALREADY_EXIST"]);
      } else {
        new SupplierModelModel({
          id: id,
          name: name,
          address: address,
          email: email,
          phoneNumber: phone,
          npwp: npwp,
          createdBy: userID,
        })
          .update()
          .then((result) => {
            return res.status(200).send(result);
          })
          .catch((error) => {
            new LoggerHelper({
              message: `Error on updating supplier ${error}`,
              type: LoggerType.error,
              tag: "Supplier",
            }).log();
            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      }
    });
  };

  static delete = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;
    SupplierModelModel.preDelete(id)
      .then((validation) => {
        if (!validation) {
          return res.status(404).send(ErrorList["SUPPLIER_NOT_FOUND"]);
        } else {
          SupplierModelModel.deleteByID(id, userID)
            .then((result) => {
              return res.status(201).send(result);
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on deleting supplier ${error}`,
                tag: "Supplier",
                type: LoggerType.error,
              }).log();
              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on pre-deleting supplier ${error}`,
          tag: "Supplier",
          type: LoggerType.error,
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default SupplierController;
