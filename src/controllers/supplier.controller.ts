import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { SupplierRepository } from "../repositories/supplier.repository";
import LoggerHelper from "../utils/logger.helper";

/** Lapisan HTTP untuk pemasok. */
export class SupplierController {
  private supplierRepository: SupplierRepository;

  constructor(supplierRepository: SupplierRepository) {
    this.supplierRepository = supplierRepository;
  }

  create = async (req: Request, res: Response) => {
    try {
      if (await this.supplierRepository.isNameTaken(req.body.name)) {
        return res.status(404).send(ErrorList["SUPPLIER_ALREADY_EXIST"]);
      }

      const result = await this.supplierRepository.create({
        name: req.body.name,
        address: req.body.address,
        email: req.body.email,
        phoneNumber: req.body.phone,
        npwp: req.body.npwp,
        createdBy: req.body.userID,
      });

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on creating supplier ${error}`,
        tag: "Supplier",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.supplierRepository.fetch({
        keyword: req.query.keyword as string,
        page: !req.query.page ? 1 : parseInt(req.query.page as string),
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching supplier ${error}`,
        tag: "Supplier",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.supplierRepository.fetchByID(req.params.id);

      /* Pemasok yang tidak ada dibalas 200 dengan badan null, seperti sebelumnya. */
      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching supplier ${error}`,
        tag: "Supplier",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchAutocomplete = async (req: Request, res: Response) => {
    try {
      const result = await this.supplierRepository.fetchAutocomplete(
        req.query.keyword as string
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching supplier autocomplete ${error}`,
        type: LoggerType.error,
        tag: "Supplier",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const taken = await this.supplierRepository.isNameTakenByOther({
        id: req.body.id,
        name: req.body.name,
      });

      if (taken) {
        return res.status(400).send(ErrorList["SUPPLIER_ALREADY_EXIST"]);
      }

      const result = await this.supplierRepository.update({
        _id: req.body.id,
        name: req.body.name,
        address: req.body.address,
        email: req.body.email,
        phoneNumber: req.body.phone,
        npwp: req.body.npwp,
        createdBy: req.body.userID,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on updating supplier ${error}`,
        type: LoggerType.error,
        tag: "Supplier",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      if (!(await this.supplierRepository.existsActive(req.params.id))) {
        return res.status(404).send(ErrorList["SUPPLIER_NOT_FOUND"]);
      }

      const result = await this.supplierRepository.delete(
        req.params.id,
        req.body.userID
      );

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on deleting supplier ${error}`,
        tag: "Supplier",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default SupplierController;
