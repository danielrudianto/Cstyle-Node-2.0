import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import { LoggerType } from "../interfaces/logger.interface";
import ItemBrandModelModel from "../models/item-brand.model";
import LoggerHelper from "../utils/logger.utils";

class ItemBrandController {
  static create = (req: Request, res: Response) => {
    const name = req.body.name;
    const userID = req.body.userID;
    ItemBrandModelModel.preCreate({
      name: name,
    })
      .then((validation) => {
        if (!validation) {
          return res.status(404).send(ErrorList["ITEM_BRAND_ALREADY_EXIST"]);
        } else {
          new ItemBrandModelModel({
            name: name,
            createdBy: userID,
            createdAt: new Date(),
          })
            .create()
            .then((result) => {
              return res.status(201).send(result);
            })
            .catch((error) => {
              new LoggerHelper({
                type: LoggerType.error,
                message: `Error on creating item brand ${error}`,
                tag: "Item-brand",
              }).log();
              return res.status(500).send(error);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on pre-creating item brand ${error}`,
          tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
      });
  };

  // DELETE THIS CONTROLLER
  static fetch = (req: Request, res: Response) => {
    const page = req.query.page == null ? 1 : Number(req.query.page);
    const keyword =
      req.query.keyword == null ? "" : req.query.keyword.toString();
    ItemBrandModelModel.fetch({
      page: page,
      keyword: keyword,
    })
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching item brand ${error}`,
          tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
      });
  };

  // DO NOT DELETE THIS CONTROLLER
  static fetchV2 = (req: Request, res: Response) => {
    const page = req.query.page == null ? 1 : Number(req.query.page);
    const keyword =
      req.query.keyword == null ? "" : req.query.keyword.toString();
    ItemBrandModelModel.fetchV2({
      page: page,
      keyword: keyword,
    })
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching item brand ${error}`,
          tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    ItemBrandModelModel.fetchByID(id)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching item brand by ID ${error}`,
          tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
      });
  };

  static fetchAutocomplete = (req: Request, res: Response) => {
    const keyword =
      req.query.keyword == null ? "" : req.query.keyword.toString();
    ItemBrandModelModel.fetchAutocomplete(keyword)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching item brand autocomplete ${error}`,
          tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
      });
  };

  static update = (req: Request, res: Response) => {
    const id = req.body.id;
    const name = req.body.name;
    ItemBrandModelModel.preUpdate({
      id: id,
      name: name,
    })
      .then((validation) => {
        if (!validation) {
          return res.status(404).send(ErrorList["ITEM_BRAND_ALREADY_EXIST"]);
        } else {
          new ItemBrandModelModel({
            id: id,
            name: name,
            createdAt: new Date(),
          })
            .update()
            .then(([result, _]) => {
              return res.status(201).send(result);
            })
            .catch((error) => {
              new LoggerHelper({
                type: LoggerType.error,
                message: `Error on pre-updating item brand ${error}`,
                tag: "Item-brand",
              }).log();
              return res.status(500).send(error);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on updating item brand ${error}`,
          tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
      });
  };

  static delete = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;
    ItemBrandModelModel.preDelete({
      id: id,
    })
      .then((validation) => {
        if (!validation) {
          return res.status(404).send(ErrorList["ITEM_BRAND_NOT_FOUND"]);
        } else {
          new ItemBrandModelModel({
            id: id,
            createdBy: userID,
            createdAt: new Date(),
          })
            .delete()
            .then((result) => {
              return res.status(201).send(result);
            })
            .catch((error) => {
              new LoggerHelper({
                type: LoggerType.error,
                message: `Error on deleting item brand ${error}`,
                tag: "Item-brand",
              }).log();
              return res.status(500).send(error);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on pre-deleting item brand ${error}`,
          tag: "Item-brand",
        }).log();
        return res.status(500).send(error);
      });
  };
}

export default ItemBrandController;
