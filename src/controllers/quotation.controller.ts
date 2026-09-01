import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { QuotationStatus } from "../interfaces/quotation.interface";
import { QuotationRepository } from "../repositories/quotation.repository";
import LoggerHelper from "../utils/logger.helper";

/** Lapisan HTTP untuk penawaran. */
export class QuotationController {
  private quotationRepository: QuotationRepository;

  constructor(quotationRepository: QuotationRepository) {
    this.quotationRepository = quotationRepository;
  }

  /**
   * Membuat penawaran baru.
   *
   * Nomornya disusun dari jumlah penawaran pada bulan yang sama. Dua permintaan
   * yang berbarengan akan membaca hitungan yang sama lalu bentrok pada indeks
   * unique — yang kedua gagal dan pengguna perlu mengulang. Lihat catatan di
   * quotation.repository.ts.
   */
  create = async (req: Request, res: Response) => {
    const date = new Date(req.body.date);

    try {
      const count = await this.quotationRepository.countByMonthYear(
        date.getMonth() + 1,
        date.getFullYear()
      );

      const name =
        "Q-CS-" +
        date.getFullYear() +
        "-" +
        (date.getMonth() + 1).toString().padStart(2, "0") +
        "-" +
        (count + 1).toString().padStart(4, "0");

      const result = await this.quotationRepository.create({
        name: name,
        date: date,
        expiryDate: new Date(req.body.expiry_date),
        customerID: req.body.customer_id,
        note: req.body.note,
        createdBy: req.body.userID,
        createdAt: new Date(),
        items: req.body.items as any[],
      });

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on creating quotation ${error}`,
        type: LoggerType.error,
        tag: "Quotation",
      }).log();

      return res.status(500).send(ErrorList["QUOTATION_CREATE_FAILED"]);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const quotation = await this.quotationRepository.fetchByID(
        req.params.id
      );

      if (!quotation || quotation.isDelete) {
        return res.status(404).send(ErrorList["QUOTATION_NOT_FOUND"]);
      }

      const result = await this.quotationRepository.delete(
        req.params.id,
        req.body.userID
      );

      /*
        Kode lama TIDAK PERNAH membalas pada jalur sukses — isi .then()-nya
        kosong, sehingga permintaan menggantung sampai klien menyerah, padahal
        penawarannya sudah benar-benar dibatalkan. Sekarang dibalas 200.
      */
      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on deleting quotation ${error}`,
        type: LoggerType.error,
        tag: "Quotation",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.quotationRepository.fetchByID(req.params.id);
      if (!result) {
        return res.status(404).send(ErrorList["QUOTATION_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching quotation ${error}`,
        tag: "Quotation",
      }).log();

      return res.status(500).send(error);
    }
  };

  search = async (req: Request, res: Response) => {
    try {
      const result = await this.quotationRepository.search({
        keyword: req.body.keyword,
        page: req.body.page,
        /* Klien mengirim bulan 0-11 seperti JavaScript; MongoDB memakai 1-12. */
        month: req.body.month + 1,
        year: req.body.year,
        status: req.body.status as QuotationStatus[],
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on searching quotation ${error}`,
        type: LoggerType.error,
        tag: "Quotation",
      }).log();

      return res.status(500).send(error);
    }
  };
}

export default QuotationController;
