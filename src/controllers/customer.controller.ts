import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import { LoggerType } from "../interfaces/logger.interface";
import CustomerModelModel from "../models/customer.model";
import LoggerHelper from "../utils/logger.utils";

class CustomerController {
  static create = (req: Request, res: Response) => {
    const name = req.body.name;
    const userID = req.body.userID;
    const address = req.body.address;
    const type = req.body.type;
    const phone = req.body.phone;
    const email = req.body.email;
    const npwp = req.body.npwp;

    new CustomerModelModel({
      name: name,
      address: address,
      type: type,
      phone: phone,
      email: email,
      npwp: npwp,
      createdBy: userID,
      createdAt: new Date(),
    })
      .create()
      .then((result) => {
        return res.status(201).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on creating customer ${error}`,
          type: LoggerType.error,
          tag: "Customer",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static updateV2 = (req: Request, res: Response) => {
    const id = req.body.id;
    const name = req.body.name;
    const address = req.body.address;
    const type = req.body.type;
    const phone = req.body.phone;
    const email = req.body.email;
    const npwp = req.body.npwp;

    CustomerModelModel.fetchByID(id).then((customer) => {
      if (!customer) {
        return res.status(404).send(ErrorList["CUSTOMER_NOT_FOUND"]);
      } else if (customer.isDelete) {
        return res.status(404).send(ErrorList["CUSTOMER_NOT_FOUND"]);
      } else {
        new CustomerModelModel({
          id: id,
          name: name,
          address: address,
          type: type,
          phone: phone,
          email: email,
          npwp: npwp,
        })
          .update()
          .then((result) => {
            return res.status(201).send(result);
          })
          .catch((error) => {
            new LoggerHelper({
              type: LoggerType.error,
              message: `Error on creating customer ${error}`,
              tag: "Customer",
            }).log();
            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          });
      }
    });
  };

  static deleteByID = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;
    // CustomerModel.findById(id)
    //   .then((customer) => {
    //     if (!customer) {
    //       return res.status(404).send(ErrorList["CUSTOMER_NOT_FOUND"]);
    //     }

    //     if (customer.isDelete) {
    //       return res.status(404).send(ErrorList["CUSTOMER_NOT_FOUND"]);
    //     }

    //     customer.isDelete = true;
    //     customer.deletedAt = new Date();
    //     customer.deletedBy = userID;

    //     customer
    //       .save()
    //       .then((value) => {
    //         return res.status(201).send(value);
    //       })
    //       .catch((error) => {
    //         console.error(`[error]: Error on deleting customer: ${error}`);
    //         return res.status(400).send(ErrorList["DELETE_CUSTOMER_FAILED"]);
    //       });
    //   })
    //   .catch((error) => {
    //     console.error(`[error]: Error on fetching customer: ${error}`);
    //     return res.status(400).send(ErrorList["DELETE_CUSTOMER_FAILED"]);
    //   });
  };

  static fetchV2 = (req: Request, res: Response) => {
    const keyword = req.query.keyword?.toString() ?? "";
    const page =
      req.query.page == undefined ? 1 : parseInt(req.query.page.toString());

    CustomerModelModel.fetchV2({
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
          message: `Error on fetching customer ${error}`,
          type: LoggerType.error,
          tag: "Customer",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchAutocompleteBulk = (req: Request, res: Response) => {
    const keyword = req.query.keyword as string;
    CustomerModelModel.fetchAutocomplete(keyword, "bulk")
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching customer ${error}`,
          tag: "Customer",
          type: LoggerType.error,
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchAutocompleteConsignment = (req: Request, res: Response) => {
    const keyword = req.query.keyword as string;
    CustomerModelModel.fetchAutocomplete(keyword, "consignment")
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching customer ${error}`,
          tag: "Customer",
          type: LoggerType.error,
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    CustomerModelModel.fetchByID(id)
      .then((customer) => {
        if (!customer) {
          return res.status(404).send(ErrorList["CUSTOMER_NOT_FOUND"]);
        } else {
          return res.status(200).send(customer);
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching customer ${error}`,
          tag: "Customer",
          type: LoggerType.error,
        }).log();
      });
  };
}

export default CustomerController;
