import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import { LoggerType } from "../interfaces/logger.interface";
import ItemModelModel from "../models/item.model";
import StockModelModel from "../models/stock.model";
import LoggerHelper from "../utils/logger.utils";
import StoreModelModel from "../models/store.model";

class ItemStockController {
  static fetch = (req: Request, res: Response) => {
    const storeID = req.body.storeID;
    const keyword = req.query.keyword as string;
    const page = !req.query.page ? 1 : parseInt(req.query.page.toString());

    ItemModelModel.fetch({
      keyword: keyword,
      page: page,
      onlyActive: false,
    })
      .then(([items, itemCount]) => {
        StockModelModel.checkDashboardStockByItemIDs(
          items.map((x) => {
            return {
              itemID: x._id,
              quantity: 0,
            };
          }),
          storeID
        )
          .then(([onPremiseStock, otherStock]) => {
            return res.status(200).send({
              data: items.map((x) => {
                const stockIndex = onPremiseStock.findIndex(
                  (y) => y._id.toString() == x._id.toString()
                );

                const otherStockIndex = otherStock.findIndex(
                  (y) => y._id.toString() == x._id.toString()
                );
                return {
                  reference: x.reference,
                  description: x.description,
                  onPremiseStock:
                    stockIndex == -1 ? 0 : onPremiseStock[stockIndex].quantity,
                  otherStock:
                    otherStockIndex == -1
                      ? 0
                      : otherStock[otherStockIndex].quantity,
                  _id: x._id,
                };
              }),
              count: itemCount,
            });
          })
          .catch((error) => {
            new LoggerHelper({
              type: LoggerType.error,
              message: `Error on checking stock: ${error.message}`,
              tag: "ItemStockController",
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching item stock: ${error}`,
          tag: "ItemStockController",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchStockByStoreID = (req: Request, res: Response) => {
    const keyword = req.body.keyword;
    const page = req.body.page;
    const storeID =
      req.body.targetStoreID === "null" ? null : req.body.targetStoreID;

    ItemModelModel.fetchV2WStock({
      page: page,
      keyword: keyword,
      branch: storeID,
      onlyActive: false,
    })
      .then(async ([items, count]) => {
        return res.status(200).send({
          data: items,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching item stock: ${error}`,
          tag: "ItemStockController",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByItemID = (req: Request, res: Response) => {
    const id = req.params.id;
    Promise.all([
      ItemModelModel.fetchByID(id),
      StockModelModel.fetchByItemID(id),
    ])
      .then(([item, result]) => {
        return res.status(200).send({
          item: item,
          stock: result,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching item stock: ${error}`,
          tag: "ItemStockController",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static download = (req: Request, res: Response) => {
    Promise.all([
      StockModelModel.fetchInitial(),
      ItemModelModel.download(),
      StoreModelModel.fetchOthers(null),
    ])
      .then(([stocks, items, stores]) => {
        return res.status(200).send({
          stores: stores,
          items: items,
          stocks: stocks,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on downloading item stock: ${error}`,
          tag: "ItemStockController",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByStoreID = (req: Request, res: Response) => {};
}

export default ItemStockController;
