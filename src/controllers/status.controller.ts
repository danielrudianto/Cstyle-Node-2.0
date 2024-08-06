import { Request, Response } from "express";
import BillModelModel from "../models/bill.model";
import ItemModelModel from "../models/item.model";
import MembershipModelModel from "../models/membership.model";
import { ErrorList } from "..//data/error-list";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import ItemBrandModelModel from "../models/item-brand.model";
import ItemTypeModelModel from "../models/item-type.model";

class StatusController {
  static fetchStatusDashboard = (req: Request, res: Response) => {
    Promise.all([
      MembershipModelModel.count(),
      ItemModelModel.fetchPopular(),
      BillModelModel.fetchStatus(),
    ])
      .then(
        ([
          [memberCountStore, memberCountCountires],
          popularItems,
          [dailySales, weeklySales, biWeeklySales, monthlySales],
        ]) => {
          return res.status(200).send({
            memberCount: memberCountStore.reduce(
              (a: any, b: any) => a + b.count,
              0
            ),
            popularItems: popularItems,
            memberMap: memberCountCountires
              .filter((x: any) => x._id != null)
              .map((x: any) => {
                return {
                  count: x.count,
                  nationality: x._id,
                };
              }),
            memberStoreMap: memberCountStore.map((x: any) => {
              return {
                count: x.count,
                storeID: x.store,
              };
            }),
            sales: {
              daily: dailySales.length == 0 ? 0 : dailySales[0].value,
              weekly: weeklySales.length == 0 ? 0 : weeklySales[0].value,
              biweekly: biWeeklySales.length == 0 ? 0 : biWeeklySales[0].value,
              monthly: monthlySales.length == 0 ? 0 : monthlySales[0].value,
            },
          });
        }
      )
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching status dashboard ${error}`,
          tag: "Status",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchStatusMembership = (req: Request, res: Response) => {
    Promise.all([
      MembershipModelModel.count(),
      MembershipModelModel.countNewMembers(),
      BillModelModel.fetchMemberTransactions(),
    ])
      .then(([[memberCount, _], memberNewCount, transactions]) => {
        return res.status(200).send({
          total: memberCount.reduce((a, b) => a + b.count, 0),
          recent: memberNewCount,
          recentTransactions: transactions,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching status membership ${error}`,
          tag: "Status",
          type: LoggerType.error,
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchStatusItem = (req: Request, res: Response) => {
    Promise.all([
      ItemModelModel.count(),
      ItemBrandModelModel.count(),
      ItemTypeModelModel.count(),
    ]).then(([item, brand, type]) => {
      return res.status(200).send({
        item: item,
        brand: brand,
        type: type,
      });
    });
  };
}

export default StatusController;
