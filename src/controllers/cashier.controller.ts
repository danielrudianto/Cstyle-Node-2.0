import { Request, Response } from "express";
import BillModelModel from "../models/bill.model";
import moment from "moment";
import { Types } from "mongoose";
import MembershipModelModel from "../models/membership.model";
import { BillInterface } from "../interfaces/bill.interface";
import StockModelModel from "../models/stock.model";
import { ErrorList } from "../data/error-list";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { queue } from "../utils/queue.utils";
import StoreModelModel from "../models/store.model";
import AsyncLock from "async-lock";
import { StockOutInterface } from "../interfaces/stock-out.interface";

const lock = new AsyncLock();

class CashierController {
  static sync = async (req: Request, res: Response) => {
    const storeID = req.body.storeID;
    const data = req.body.data as any[];
    const memberCodeSet = new Set<string>();
    const bills: BillModelModel[] = [];

    data.forEach((x) => {
      if (x.memberID != null) {
        memberCodeSet.add(x.memberID);
      }

      const bill = new BillModelModel({
        name: x.name,
        date: moment(x.date).format("YYYY-MM-DD"),
        memberID: x.memberID,
        storeID: storeID,
        createdBy: x.createdBy,
        createdAt: new Date(x.createdAt),
        items: (x.bills as any[]).map((a) => {
          return {
            itemID: a.itemID,
            quantity: a.quantity,
            price: a.price,
            discount: (a.discount * a.price) / 100,
            percentage: a.discount,
          };
        }),
        payment: (x.payments as any[]).map((b) => {
          return {
            type: b.paymentMethod,
            amount: b.amount,
          };
        }),
      });

      bills.push(bill);
    });

    const memberIDs = await MembershipModelModel.fetchByIDs([...memberCodeSet]);
    const modifiedBills: BillInterface[] = [];
    bills.forEach((x) => {
      const member = memberIDs.find((y) => y.code == x.memberID);
      if (x.memberID != null && member == null) {
        return;
      } else {
        modifiedBills.push({
          ...x,
          memberID: x.memberID == null ? null : member!._id,
        });
      }
    });

    const groupedData = modifiedBills.reduce(
      (
        acc: { [key: string]: { itemID: string; quantity: number } },
        current
      ) => {
        current.items.forEach((item) => {
          if (!acc[item.itemID.toString()]) {
            acc[item.itemID.toString()] = {
              itemID: item.itemID.toString(),
              quantity: 0,
            };
          }
          acc[item.itemID.toString()].quantity += item.quantity;
        });
        return acc;
      },
      {}
    );

    await lock.acquire(
      Object.entries(groupedData).map(([_, value]) => {
        return value.itemID;
      }),
      async () => {
        StockModelModel.checkStockByItemIDs(
          Object.entries(groupedData).map(([_, value]) => {
            return { itemID: value.itemID, quantity: value.quantity };
          }),
          storeID
        )
          .then(async (result) => {
            await lock.acquire(
              Object.entries(groupedData).map(([_, value]) => {
                return value.itemID;
              }),
              async () => {
                const comparisonResults = result.map((item) => {
                  const groupedItem = groupedData[item.itemID];
                  return groupedItem.quantity <= item.quantity;
                });

                if (comparisonResults.includes(false)) {
                  return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
                } else {
                  BillModelModel.insertMany(modifiedBills)
                    .then((result) => {
                      result.forEach(async (x) => {
                        x.items.forEach(async (y: any) => {
                          await new StockModelModel({
                            itemID: y.itemID,
                            quantity: y.quantity * -1,
                            storeID: x.storeID,
                          }).update();
                        });

                        await queue.add("createBill", {
                          id: x._id,
                        });
                      });

                      return res.status(200).send(result);
                    })
                    .catch((error) => {
                      new LoggerHelper({
                        message: `Error on creating bill ${error}`,
                        type: LoggerType.error,
                        tag: "Cashier",
                      }).log();
                      return res
                        .status(500)
                        .send(ErrorList["INTERNAL_SERVER_ERROR"]);
                    });
                }
              }
            );
          })
          .catch((error) => {
            new LoggerHelper({
              message: `Error on checking stock ${error}`,
              type: LoggerType.error,
              tag: "Cashier",
            }).log();
            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      }
    );
  };

  static checkStore = (req: Request, res: Response) => {
    var uid = req.params.storeCode;
    let formattedUID = "";
    // If UID is not formatted as UUID, convert it to UUID
    if (uid.match(/^[0-9a-fA-F]{32}$/)) {
      // Format UID as UUID (36 characters) from a 24-character string
      formattedUID =
        uid.substring(0, 8) +
        "-" +
        uid.substring(8, 12) +
        "-" +
        uid.substring(12, 16) +
        "-" +
        uid.substring(16, 20) +
        "-" +
        uid.substring(20, 32);
      StoreModelModel.fetchByCode(formattedUID.toLowerCase())
        .then((result) => {
          return res.status(200).send(result);
        })
        .catch((error) => {
          new LoggerHelper({
            message: `Error on fetching store ${error}`,
            tag: "Store",
            type: LoggerType.error,
          }).log();
          return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    } else {
      return res.status(400).send(ErrorList["INVALID_STORE_UID"]);
    }
  };

  static fetchStock = (req: Request, res: Response) => {
    const storeID = req.body.storeID;
    StockModelModel.fetchByStoreID(storeID)
      .then((result) => {
        return res.status(200).send(
          result.map((x) => {
            return {
              mongoID: x.itemID,
              stock: x.quantity,
            };
          })
        );
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching stock data ${error}`,
          type: LoggerType.error,
          tag: "Cashier",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default CashierController;
