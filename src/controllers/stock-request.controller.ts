import { NextFunction, Request, Response } from "express";
import StockModel from "../schemas/impl.stock.model";
import { ErrorList } from "../data/error-list";
import stockRequestModel from "../schemas/ins.stock-request.model";
import UserModel from "../schemas/ins.user.model";
import { Types } from "mongoose";
import StockRequestModelModel from "../models/stock-request.model";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import StockModelModel from "../models/stock.model";
import { queue } from "../utils/queue.utils";
import { StockOutTransferInterface } from "../interfaces/stock-out.interface";
import lock from "../utils/lock.utils";

class StockRequestController {
  static create = async (req: Request, res: Response) => {
    // Create a stock transfer request from office to store
    const requestFrom = req.body.storeID == undefined ? null : req.body.storeID;
    const requestTo = req.body.requestTo;
    const items = req.body.item as any[];
    const note = req.body.note;
    const userID = req.body.userID;
    const date = new Date(req.body.date);

    if (requestFrom == requestTo) {
      return res.status(400).send(ErrorList["STOCK_REQUEST_SAME_STORE"]);
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const count = await StockRequestModelModel.preCreate({
      month: month,
      year: year,
    });

    const name =
      "SR-CS-" +
      new Date().getFullYear() +
      "-" +
      (new Date().getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      (count + 1).toString().padStart(4, "0");

    new StockRequestModelModel({
      name: name,
      date: date,
      requestFrom: requestFrom,
      requestTo: requestTo,
      items: items.map((x) => {
        return {
          itemID: x.id,
          quantity: x.quantity,
        };
      }),
      note: note,
      createdBy: userID,
    })
      .create()
      .then((result) => {
        return res.status(201).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on creating stock request: ${error.message}`,
          type: LoggerType.error,
          tag: "Stock request",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static searchV2 = (req: Request, res: Response) => {
    const page = req.body.page;
    const keyword = req.body.keyword as string;
    const status = req.body.status as string[];
    const month = req.body.month;
    const year = req.body.year;

    StockRequestModelModel.fetch({
      page: page,
      keyword: keyword,
      status: status,
      month: month + 1,
      year: year,
    })
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching stock transfer requests ${error}`,
          tag: "Stock transfer request",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    StockRequestModelModel.fetchByID(id)
      .then((result) => {
        if (!result) {
          return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
        } else {
          return res.status(200).send(result);
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching stock transfer request ${error}`,
          tag: "Stock transfer request",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static reject = async (req: Request, res: Response) => {
    const id = req.body.id;
    const rejectNote = req.body.reason;
    const stockRequest = req.body.stockRequest;
    const userID = req.body.userID;

    StockRequestModelModel.rejectByID(id, userID, rejectNote).then(
      async (result) => {
        await lock.acquire(
          stockRequest.items.map((x: any) => {
            return x.itemID;
          }),
          () => {
            stockRequest.items.forEach(async (x: any) => {
              const data: StockOutTransferInterface = {
                itemID: x.itemID,
                quantity: x.quantity,
                storeID: stockRequest.requestTo,
              };

              await new StockModelModel(data).update();
            });
          }
        );

        return res.status(201).send(result);
      }
    );
  };

  static deleteByID = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;
    StockRequestModelModel.fetchByID(id)
      .then((stockRequest) => {
        if (!stockRequest || stockRequest.isDelete) {
          return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
        } else if (stockRequest.isReject) {
        } else if (!stockRequest.isSending) {
          // Stock transfer request never been sent
          StockRequestModelModel.deleteByID(id, userID).then((result) => {
            return res.status(201).send(result);
          });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching stock request: ${error.message}`,
          tag: "Stock request",
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchIncompleteRequests = (req: Request, res: Response) => {
    // // Have to supply from or to
    // const requestFrom = req.body.from;
    // const requestTo = req.body.to;
    // if (!req.body.hasOwnProperty("from") && !req.body.hasOwnProperty("to")) {
    //   return res
    //     .status(400)
    //     .send(ErrorList["STOCK_REQUEST_FROM_OR_TO_REQUIRED"]);
    // } else if (req.body.hasOwnProperty("from")) {
    //   const page = req.body.page;
    //   const mode = req.body.mode;
    //   // Fetch requests from this location
    //   switch (mode) {
    //     case "confirmed":
    //       stockRequestModel
    //         .find({
    //           from: requestFrom,
    //           isConfirm: true,
    //         })
    //         .populate("items.itemID")
    //         .limit(10)
    //         .skip((page - 1) * 10)
    //         .then((result) => {
    //           return res.status(200).send(result);
    //         })
    //         .catch((error) => {
    //           return res.status(500).send(error);
    //         });
    //       break;
    //     case "rejected":
    //       stockRequestModel
    //         .find({
    //           from: requestFrom,
    //           isReject: true,
    //         })
    //         .populate("items.itemID")
    //         .limit(10)
    //         .skip((page - 1) * 10)
    //         .then((result) => {
    //           return res.status(200).send(result);
    //         })
    //         .catch((error) => {
    //           return res.status(500).send(error);
    //         });
    //       break;
    //     case "all":
    //     default:
    //       stockRequestModel
    //         .find({
    //           from: requestFrom,
    //         })
    //         .populate("items.itemID")
    //         .limit(10)
    //         .skip((page - 1) * 10)
    //         .then((result) => {
    //           return res.status(200).send(result);
    //         })
    //         .catch((error) => {
    //           return res.status(500).send(error);
    //         });
    //       break;
    //   }
    // } else {
    //   const page = req.body.page;
    //   const mode = req.body.mode;
    //   // Fetch requests from this location
    //   switch (mode) {
    //     case "confirmed":
    //       stockRequestModel
    //         .find({
    //           to: requestFrom,
    //           isConfirm: true,
    //         })
    //         .populate("items.itemID")
    //         .limit(10)
    //         .skip((page - 1) * 10)
    //         .then((result) => {
    //           return res.status(200).send(result);
    //         })
    //         .catch((error) => {
    //           return res.status(500).send(error);
    //         });
    //       break;
    //     case "rejected":
    //       stockRequestModel
    //         .find({
    //           to: requestTo,
    //           isReject: true,
    //         })
    //         .populate("items.itemID")
    //         .limit(10)
    //         .skip((page - 1) * 10)
    //         .then((result) => {
    //           return res.status(200).send(result);
    //         })
    //         .catch((error) => {
    //           return res.status(500).send(error);
    //         });
    //       break;
    //     case "all":
    //     default:
    //       stockRequestModel
    //         .find({
    //           to: requestTo,
    //         })
    //         .populate("items.itemID")
    //         .limit(10)
    //         .skip((page - 1) * 10)
    //         .then((result) => {
    //           return res.status(200).send(result);
    //         })
    //         .catch((error) => {
    //           return res.status(500).send(error);
    //         });
    //       break;
    //   }
    // }
  };

  static send = async (req: Request, res: Response) => {
    const id = req.body.id;
    const userID = req.body.userID;
    const items = req.body.items as any[];

    const stockRequest = await StockRequestModelModel.fetchByID(id);
    if (!stockRequest || stockRequest.isDelete) {
      return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
    }

    if (stockRequest.isConfirm || stockRequest.isReject) {
      return res.status(405).send(ErrorList["STOCK_REQUEST_ALREADY_PROCESSED"]);
    }

    if (stockRequest.isSending) {
      return res.status(405).send(ErrorList["STOCK_REQUEST_ALREADY_SENT"]);
    }

    await lock.acquire(
      items.map((x: any) => x.itemID.toString()),
      async () => {
        StockModelModel.checkStockByItemIDs(
          items.map((x: any) => {
            return {
              itemID: x.itemID,
              quantity: x.quantity,
            };
          }),
          stockRequest.requestTo
        ).then((stocks) => {
          let validation = true;
          for (let i = 0; i < stockRequest.items.length; i++) {
            const stockIndex = stocks.findIndex(
              (x: any) => x.itemID.toString() == items[i].itemID
            );

            const stock = stockIndex == -1 ? 0 : stocks[stockIndex].quantity;
            if (stock < items[i].quantity) {
              validation = false;
            }
          }

          if (!validation) {
            return res.status(405).send(ErrorList["INSUFFICIENT_STOCK"]);
          } else {
            StockRequestModelModel.send({
              id: id,
              createdBy: userID,
              items: items,
            })
              .then(async (result) => {
                items.forEach(async (x: any) => {
                  await new StockModelModel({
                    storeID: stockRequest.requestTo,
                    itemID: x.itemID,
                    quantity: x.quantity * -1,
                  }).update();
                });

                return res.status(201).send(result);
              })
              .catch((error) => {
                new LoggerHelper({
                  type: LoggerType.error,
                  message: `Error on sending stock request ${error}`,
                  tag: "StockRequest",
                }).log();

                return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
              });
          }
        });
      }
    );
  };

  static checkStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const id = req.body.id;
    const stockRequest = await StockRequestModelModel.fetchByID(id);
    if (!stockRequest || stockRequest.isDelete) {
      return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
    } else if (stockRequest.isConfirm || stockRequest.isReject) {
      return res.status(405).send(ErrorList["STOCK_REQUEST_ALREADY_PROCESSED"]);
    } else {
      req.body.stockRequest = stockRequest;
      next();
    }
  };

  static confirm = async (req: Request, res: Response) => {
    const id = req.body.id;
    const stockRequest = req.body.stockRequest;
    const userID = req.body.userID;
    StockRequestModelModel.confirmByID(id, userID).then((result) => {
      stockRequest.items.forEach(async (x: any) => {
        const data: StockOutTransferInterface = {
          itemID: x.itemID,
          quantity: x.quantity,
          storeID: stockRequest.requestFrom,
        };
        await queue.add("insertStokInTransfer", data);
      });

      return res.status(201).send(result);
    });
  };

  /**
   * Fetch incompleted stock request
   * @param req
   * @param res
   */
  static fetchIncompletedRequests = (req: Request, res: Response) => {
    // const storeID = req.body.storeID;
    // stockRequestModel
    //   .find({
    //     requestFrom: storeID,
    //     isConfirm: false,
    //     isReject: false,
    //     isSending: true,
    //   })
    //   .populate("createdBy", "name")
    //   .populate("items.itemID", "reference description")
    //   .populate("requestFrom", "name address")
    //   .populate("requestTo", "name address")
    //   .populate("sendBy", "name")
    //   .then((result) => {
    //     return res.status(200).send(result);
    //   })
    //   .catch((error) => {
    //     return res.status(500).send(error);
    //   });
  };

  static fetchUnsentRequests = (req: Request, res: Response) => {
    const requestTo = req.body.requestTo as string | null;
    const page = req.body.page;

    StockRequestModelModel.fetchUnsent(page, requestTo)
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching unsent request ${error}`,
          tag: "Stock request",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchUnreceivedRequests = (req: Request, res: Response) => {
    const requestFrom = req.body.requestFrom as string | null;
    const page = req.body.page;

    StockRequestModelModel.fetchUnreceived(page, requestFrom)
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching unsent request ${error}`,
          tag: "Stock request",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static receive = (req: Request, res: Response) => {
    // const id = req.body.id;
    // const userID = req.body.updatedBy;
    // const isConfirm = req.body.isConfirm;
    // const rejectNote = req.body.rejectNote;
    // // Check if user is active
    // UserModel.findById(userID)
    //   .then((user) => {
    //     if (user == null) {
    //       return res.status(404).send(ErrorList["USER_NOT_FOUND"]);
    //     }
    //     if (!user.isActive) {
    //       return res.status(404).send(ErrorList["USER_NOT_ACTIVE"]);
    //     }
    //     stockRequestModel.findById(id).then((stockTransferRequest) => {
    //       if (!stockTransferRequest) {
    //         return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
    //       }
    //       if (stockTransferRequest.isConfirm || stockTransferRequest.isReject) {
    //         return res
    //           .status(404)
    //           .send(ErrorList["STOCK_REQUEST_ALREADY_RECEIVED"]);
    //       } else {
    //         if (isConfirm) {
    //           // Is confirming stock transfer request
    //           stockTransferRequest.isConfirm = true;
    //           stockTransferRequest.updatedAt = new Date();
    //           stockTransferRequest.updatedBy = userID;
    //           stockTransferRequest
    //             .save()
    //             .then(async (result) => {
    //               if (!result) {
    //                 return res
    //                   .status(500)
    //                   .send(ErrorList["STOCK_REQUEST_UPDATE_FAILED"]);
    //               }
    //               const updateArray: any[] = [];
    //               result.items.forEach((item: any) => {
    //                 updateArray.push({
    //                   itemID: item.itemID,
    //                   storeID: result.requestFrom,
    //                   quantity: item.quantity,
    //                 });
    //               });
    //               await queue.add("updateStock", {
    //                 data: updateArray,
    //               });
    //               return res.status(200).send(result);
    //             })
    //             .catch((error) => {
    //               console.error(
    //                 `[error]: Error on updating stock request. ${error}`
    //               );
    //               return res.status(500).send(error);
    //             });
    //         } else {
    //           // Is rejecting stock transfer request
    //           stockTransferRequest.isReject = true;
    //           stockTransferRequest.rejectNote = rejectNote;
    //           stockTransferRequest.updatedAt = new Date();
    //           stockTransferRequest.updatedBy = userID;
    //           stockTransferRequest
    //             .save()
    //             .then(async (result) => {
    //               if (!result) {
    //                 return res
    //                   .status(500)
    //                   .send(ErrorList["STOCK_REQUEST_UPDATE_FAILED"]);
    //               }
    //               const updateArray: any[] = [];
    //               result.items.forEach((item: any) => {
    //                 updateArray.push({
    //                   itemID: item.itemID,
    //                   storeID: result.requestTo,
    //                   quantity: item.quantity,
    //                 });
    //               });
    //               await queue.add("updateStock", {
    //                 data: updateArray,
    //               });
    //               return res.status(201).send(result);
    //             })
    //             .catch((error) => {
    //               console.error(
    //                 `[error]: Error on updating stock request. ${error}`
    //               );
    //               return res.status(500).send(error);
    //             });
    //         }
    //       }
    //     });
    //   })
    //   .catch((error) => {
    //     return res.status(500).send(error);
    //   });
  };

  static search = (req: Request, res: Response) => {
    //     const month = req.body.month;
    //     const year = req.body.year;
    //     const page = req.body.page;
    //     const status = req.body.status;
    //     switch (status.toLowerCase()) {
    //       case "sent":
    //         stockRequestModel
    //           .find({
    //             isDelete: false,
    //             isSending: true,
    //             isConfirm: false,
    //             isReject: false,
    //             $expr: {
    //               $and: [
    //                 {
    //                   $eq: [{ $month: "$createdAt" }, month],
    //                 },
    //                 {
    //                   $eq: [{ $year: "$createdAt" }, year],
    //                 },
    //               ],
    //             },
    //             name: { $regex: req.body.keyword, $options: "i" },
    //           })
    //           .limit(20)
    //           .skip((page - 1) * 20)
    //           .populate("createdBy", "name")
    //           .populate("requestFrom", "name address")
    //           .populate("requestTo", "name address")
    //           .populate("sendBy", "name")
    //           .populate("updatedBy", "name")
    //           .populate("deletedBy", "name")
    //           .then((result) => {
    //             return res.status(200).send(result);
    //           })
    //           .catch((error) => {
    //             return res.status(500).send(error);
    //           });
    //         break;
    //       case "pending":
    //         stockRequestModel
    //           .find({
    //             isDelete: false,
    //             isSending: false,
    //             $expr: {
    //               $and: [
    //                 {
    //                   $eq: [{ $month: "$createdAt" }, month],
    //                 },
    //                 {
    //                   $eq: [{ $year: "$createdAt" }, year],
    //                 },
    //               ],
    //             },
    //             name: { $regex: req.body.keyword, $options: "i" },
    //           })
    //           .limit(20)
    //           .skip((page - 1) * 20)
    //           .populate("createdBy", "name")
    //           .populate("requestFrom", "name address")
    //           .populate("requestTo", "name address")
    //           .populate("sendBy", "name")
    //           .populate("updatedBy", "name")
    //           .populate("deletedBy", "name")
    //           .then((result) => {
    //             return res.status(200).send(result);
    //           })
    //           .catch((error) => {
    //             return res.status(500).send(error);
    //           });
    //         break;
    //       case "reject":
    //         stockRequestModel
    //           .find({
    //             isReject: true,
    //             isSending: true,
    //             isDelete: false,
    //             $expr: {
    //               $and: [
    //                 {
    //                   $eq: [{ $month: "$createdAt" }, month],
    //                 },
    //                 {
    //                   $eq: [{ $year: "$createdAt" }, year],
    //                 },
    //               ],
    //             },
    //             name: { $regex: req.body.keyword, $options: "i" },
    //           })
    //           .limit(20)
    //           .skip((page - 1) * 20)
    //           .populate("createdBy", "name")
    //           .populate("requestFrom", "name address")
    //           .populate("requestTo", "name address")
    //           .populate("sendBy", "name")
    //           .populate("updatedBy", "name")
    //           .populate("deletedBy", "name")
    //           .then((result) => {
    //             return res.status(200).send(result);
    //           })
    //           .catch((error) => {
    //             return res.status(500).send(error);
    //           });
    //         break;
    //       case "delete":
    //         stockRequestModel
    //           .find({
    //             $expr: {
    //               $and: [
    //                 {
    //                   $eq: [{ $month: "$createdAt" }, month],
    //                 },
    //                 {
    //                   $eq: [{ $year: "$createdAt" }, year],
    //                 },
    //               ],
    //             },
    //             isDelete: true,
    //             name: { $regex: req.body.keyword, $options: "i" },
    //           })
    //           .limit(20)
    //           .skip((page - 1) * 20)
    //           .populate("createdBy", "name")
    //           .populate("requestFrom", "name address")
    //           .populate("requestTo", "name address")
    //           .populate("sendBy", "name")
    //           .populate("updatedBy", "name")
    //           .populate("deletedBy", "name")
    //           .then((result) => {
    //             return res.status(200).send(result);
    //           })
    //           .catch((error) => {
    //             return res.status(500).send(error);
    //           });
    //         break;
    //       case "all":
    //       default:
    //         stockRequestModel
    //           .find({
    //             $expr: {
    //               $and: [
    //                 { $eq: [{ $month: "$createdAt" }, month] },
    //                 { $eq: [{ $year: "$createdAt" }, year] },
    //               ],
    //             },
    //             name: { $regex: req.body.keyword, $options: "i" },
    //           })
    //           .limit(20)
    //           .skip((page - 1) * 20)
    //           .populate("createdBy", "name")
    //           .populate("requestFrom", "name address")
    //           .populate("requestTo", "name address")
    //           .populate("sendBy", "name")
    //           .populate("updatedBy", "name")
    //           .populate("deletedBy", "name")
    //           .then((result) => {
    //             return res.status(200).send(result);
    //           })
    //           .catch((error) => {
    //             console.error(
    //               `[error]: Error on searching stock request. ${error}`
    //             );
    //             return res.status(500).send(error);
    //           });
    //         break;
    //     }
  };
}

export default StockRequestController;
