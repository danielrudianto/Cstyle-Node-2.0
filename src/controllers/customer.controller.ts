import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { CustomerRepository } from "../repositories/customer.repository";
import LoggerHelper from "../utils/logger.helper";

/**
 * Lapisan HTTP untuk pelanggan.
 *
 * Tugasnya hanya tiga: membaca permintaan, memanggil repository, dan memilih
 * status balasan. Tidak ada query di sini.
 *
 * Repository disuntikkan lewat constructor supaya controller bisa diuji
 * dengan repository tiruan tanpa menyalakan MongoDB — sesuatu yang mustahil
 * ketika query masih menempel di model yang diimpor langsung.
 *
 * Di sinilah kosakata HTTP diterjemahkan ke kosakata database: klien
 * mengirim `phone`, koleksi menyimpan `phoneNumber`.
 */
export class CustomerController {
  private customerRepository: CustomerRepository;

  constructor(customerRepository: CustomerRepository) {
    this.customerRepository = customerRepository;
  }

  create = async (req: Request, res: Response) => {
    try {
      const result = await this.customerRepository.create({
        name: req.body.name,
        address: req.body.address,
        type: req.body.type,
        phoneNumber: req.body.phone,
        email: req.body.email,
        npwp: req.body.npwp,
        createdBy: req.body.userID,
        createdAt: new Date(),
      });

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on creating customer ${error}`,
        type: LoggerType.error,
        tag: "Customer",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const existing = await this.customerRepository.fetchByID(req.body.id);
      if (!existing || existing.isDelete) {
        return res.status(404).send(ErrorList["CUSTOMER_NOT_FOUND"]);
      }

      const result = await this.customerRepository.update({
        _id: req.body.id,
        name: req.body.name,
        address: req.body.address,
        type: req.body.type,
        phoneNumber: req.body.phone,
        email: req.body.email,
        npwp: req.body.npwp,
      });

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on updating customer ${error}`,
        tag: "Customer",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  deleteByID = async (req: Request, res: Response) => {
    try {
      const existing = await this.customerRepository.fetchByID(req.params.id);
      if (!existing || existing.isDelete) {
        return res.status(404).send(ErrorList["CUSTOMER_NOT_FOUND"]);
      }

      const result = await this.customerRepository.delete(
        req.params.id,
        req.body.userID
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on deleting customer ${error}`,
        type: LoggerType.error,
        tag: "Customer",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    const keyword = req.query.keyword?.toString() ?? "";
    const page =
      req.query.page == undefined ? 1 : parseInt(req.query.page.toString());

    try {
      const result = await this.customerRepository.fetch({
        keyword: keyword,
        page: page,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching customer ${error}`,
        type: LoggerType.error,
        tag: "Customer",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchAutocompleteBulk = async (req: Request, res: Response) => {
    return this.fetchAutocomplete(req, res, "bulk");
  };

  fetchAutocompleteConsignment = async (req: Request, res: Response) => {
    return this.fetchAutocomplete(req, res, "consignment");
  };

  /**
   * Dua route autocomplete hanya berbeda pada tipe pelanggan, jadi isinya
   * disatukan di sini. Sebelumnya dua metode ini identik baris per baris.
   */
  private fetchAutocomplete = async (
    req: Request,
    res: Response,
    type: string
  ) => {
    try {
      const result = await this.customerRepository.fetchAutocomplete(
        req.query.keyword as string,
        type
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching customer ${error}`,
        tag: "Customer",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.customerRepository.fetchByID(req.params.id);
      if (!result) {
        return res.status(404).send(ErrorList["CUSTOMER_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching customer ${error}`,
        tag: "Customer",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default CustomerController;
