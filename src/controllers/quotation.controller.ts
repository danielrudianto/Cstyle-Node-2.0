import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import moment from "moment";
import { QuotationStatus } from "../interfaces/quotation.interface";
import { LoggerType } from "../interfaces/logger.interface";
import QuotationModelModel from "../models/quotation.model";
import LoggerHelper from "../utils/logger.utils";

class QuotationController {
  static create = async (req: Request, res: Response) => {
    const customer = req.body.customer_id;
    const date = new Date(req.body.date);
    const expiryDate = new Date(req.body.expiry_date);
    const note = req.body.note;
    const userID = req.body.userID;
    const items = req.body.items as any[];

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Count the number of quotation created at the month of the date
    QuotationModelModel.countDocumentByMonthYear(month, year)
      .then((count) => {
        const name =
          "Q-CS-" +
          date.getFullYear() +
          "-" +
          (date.getMonth() + 1).toString().padStart(2, "0") +
          "-" +
          (count + 1).toString().padStart(4, "0");

        new QuotationModelModel({
          name: name,
          date: date,
          expiryDate: expiryDate,
          customerID: customer,
          note: note,
          createdBy: userID,
          createdAt: new Date(),
          items: items,
        })
          .create()
          .then((result) => {
            return res.status(201).send(result);
          })
          .catch((error) => {
            console.error(`[error]: Error on creating quotation ${error}`);
            return res.status(500).send(ErrorList["QUOTATION_CREATE_FAILED"]);
          });
      })
      .catch((error) => {
        console.error(`[error]: Error on counting quotation ${error}`);
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static delete = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;
    QuotationModelModel.fetchByID(id)
      .then((quotation) => {
        if (!quotation || quotation.isDelete) {
          return res.status(404).send(ErrorList["QUOTATION_NOT_FOUND"]);
        } else {
          QuotationModelModel.deleteByID(id, userID)
            .then((result) => {})
            .catch((error) => {
              new LoggerHelper({
                message: `Error on deleting quotation ${error}`,
                type: LoggerType.error,
                tag: "Quotation",
              }).log();
              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on deleting quotation ${error}`,
          type: LoggerType.error,
          tag: "Quotation",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    QuotationModelModel.fetchByID(id)
      .then((result) => {
        if (!result) {
          return res.status(404).send(ErrorList["QUOTATION_NOT_FOUND"]);
        }

        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          type: LoggerType.error,
          message: `Error on fetching quotation ${error}`,
          tag: "Quotation",
        }).log();
        return res.status(500).send(error);
      });
  };

  static searchV2 = (req: Request, res: Response) => {
    const keyword = req.body.keyword;
    const page = req.body.page;
    const month = req.body.month + 1;
    const year = req.body.year;
    const status = req.body.status as QuotationStatus[];

    QuotationModelModel.search({
      keyword: keyword,
      page: page,
      month: month,
      year: year,
      status: status,
    })
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on searching quotation ${error}`,
          type: LoggerType.error,
          tag: "Quotation",
        }).log();
        return res.status(500).send(error);
      });
  };
}

export default QuotationController;
