import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import { LoggerType } from "../interfaces/logger.interface";
import ItemTypeModelModel from "../models/item-type.model";
import LoggerHelper from "../utils/logger.utils";

class ItemTypeController {
  static create = (req: Request, res: Response) => {
    const name = req.body.name;
    const description = req.body.description;
    const userID = req.body.userID;

    ItemTypeModelModel.preCreate({
      name: name,
      description: description,
    })
      .then((validation) => {
        if (!validation) {
          return res.status(400).send(ErrorList["ITEM_TYPE_ALREADY_EXIST"]);
        } else {
          new ItemTypeModelModel({
            name: name,
            description: description,
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
                message: `Error on creating item type ${error}`,
                tag: "item-type",
              }).log();
              return res.status(500).send(error);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on pre-creating item type ${error}`,
          tag: "item-type",
        }).log();
        return res.status(500).send(error);
      });
  };

  static update = (req: Request, res: Response) => {
    const id = req.body.id;
    const name = req.body.name;
    const description = req.body.description;

    ItemTypeModelModel.preUpdate({
      name: name,
      id: id,
    })
      .then((validation) => {
        if (!validation) {
          return res.status(404).send(ErrorList["ITEM_TYPE_NOT_FOUND"]);
        } else {
          new ItemTypeModelModel({
            name: name,
            description: description,
            id: id,
          })
            .update()
            .then((result) => {
              return res.status(201).send({
                ...result,
                name: name,
                description: description,
              });
            })
            .catch((error) => {
              new LoggerHelper({
                type: LoggerType.error,
                message: `Error on updating item type ${error}`,
                tag: "item-type",
              }).log();
              return res.status(500).send(error);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on pre-updating item type ${error}`,
          tag: "item-type",
        }).log();
        return res.status(500).send(error);
      });
  };

  static delete = (req: Request, res: Response) => {
    const id = req.params.id;
    ItemTypeModelModel.preDelete({
      id: id,
    })
      .then((validation) => {
        if (!validation) {
          return res.status(404).send(ErrorList["ITEM_TYPE_NOT_FOUND"]);
        } else {
          new ItemTypeModelModel({
            id: id,
          })
            .delete()
            .then((result) => {
              return res.status(201).send(result);
            })
            .catch((error) => {
              console.error(`[error]: Error on deleting item type ${error}`);
              return res.status(500).send(error);
            });
        }
      })
      .catch((error) => {
        console.error(`[error]: Error on pre deleting item type ${error}`);
        return res.status(500).send(error);
      });
  };

  static fetchV2 = (req: Request, res: Response) => {
    const page = req.query.page == null ? 1 : Number(req.query.page);
    const keyword =
      req.query.keyword == null ? "" : req.query.keyword.toString();
    ItemTypeModelModel.fetchV2({
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
    ItemTypeModelModel.fetchByID(id)
      .then((result) => {
        if (!result) {
          return res.status(404).send(ErrorList["ITEM_TYPE_NOT_FOUND"]);
        } else {
          return res.status(200).send(result);
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching item type ${error}`,
          tag: "Item type",
          type: LoggerType.error,
        });
      });
  };

  /**
   * Fetch item type with autocomplete
   * @param req
   * @param res
   */
  static fetchAutocomplete = (req: Request, res: Response) => {
    const keyword =
      req.query.keyword == null ? "" : req.query.keyword.toString();
    ItemTypeModelModel.fetchAutocomplete(keyword)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching item type autocomplete ${error}`,
          tag: "Item type",
          type: LoggerType.error,
        });
        return res.status(500).send(error);
      });
  };
}

export default ItemTypeController;
