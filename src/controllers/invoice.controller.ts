import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { RemoveStockOutInterface } from "../interfaces/stock-out.interface";
import { DeliverySlipRepository } from "../repositories/delivery-slip.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { PackingListRepository } from "../repositories/packing-list.repository";
import { StockRepository } from "../repositories/stock.repository";
import lock from "../utils/lock.helper";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk faktur penjualan.
 *
 * Faktur selalu punya SATU dokumen asal: packing list atau surat jalan. Hampir
 * setiap metode di sini harus bercabang berdasarkan yang mana yang terisi.
 */
export class InvoiceController {
  private invoiceRepository: InvoiceRepository;
  private packingListRepository: PackingListRepository;
  private deliverySlipRepository: DeliverySlipRepository;
  private stockRepository: StockRepository;

  constructor(
    invoiceRepository: InvoiceRepository,
    packingListRepository: PackingListRepository,
    deliverySlipRepository: DeliverySlipRepository,
    stockRepository: StockRepository
  ) {
    this.invoiceRepository = invoiceRepository;
    this.packingListRepository = packingListRepository;
    this.deliverySlipRepository = deliverySlipRepository;
    this.stockRepository = stockRepository;
  }

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.invoiceRepository.fetch({
        page: req.body.page,
        keyword: req.body.keyword,
        /* Klien mengirim bulan gaya JavaScript, 0 - 11. */
        month: req.body.month + 1,
        year: req.body.year,
        status: req.body.status as string[],
        paymentStatus: req.body.paymentStatus as string[],
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching sales invoice ${error}`,
        tag: "Sales invoice",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Satu faktur, dengan dokumen asalnya diambil ulang secara lengkap.
   *
   * fetchByID() pada repository sudah mem-populate dokumen asalnya, tetapi
   * tanpa detail barang. Karena itu dokumen asal diambil sekali lagi lewat
   * repository-nya sendiri, lalu ditempelkan menggantikan hasil populate.
   */
  fetchByID = async (req: Request, res: Response) => {
    try {
      const result: any = await this.invoiceRepository.fetchByID(
        req.params.id
      );

      if (!result) {
        return res.status(404).send(ErrorList["SALES_INVOICE_NOT_FOUND"]);
      }

      if (result.packingListID) {
        result.packingListID = await this.packingListRepository.fetchByID(
          result.packingListID._id
        );
      } else {
        result.deliverySlipID = await this.deliverySlipRepository.fetchByID(
          result.deliverySlipID._id
        );
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching sales invoice ${error}`,
        tag: "Sales invoice",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  updatePayment = async (req: Request, res: Response) => {
    try {
      const result: any = await this.invoiceRepository.fetchByID(req.body.id);

      if (!result || result.isDelete) {
        return res.status(404).send(ErrorList["SALES_INVOICE_NOT_FOUND"]);
      }

      if (result.isPaid) {
        return res.status(400).send(ErrorList["SALES_INVOICE_PAID"]);
      }

      await this.invoiceRepository.updatePayment({
        id: req.body.id,
        paidAt: req.body.paidAt,
        paymentMethod: req.body.paymentMethod,
        amount: req.body.amount,
        paidBy: req.body.userID,
      });

      return res.status(200).send({
        paidAt: req.body.paidAt,
        paymentMethod: req.body.paymentMethod,
        amount: req.body.amount,
        paidBy: req.body.userID,
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on updating invoice payment ${error}`,
        tag: "Sales invoice",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Membatalkan faktur, mengembalikan stok, dan ikut membatalkan dokumen
   * asalnya.
   *
   * DUA CACAT DIPERBAIKI DI SINI, KEDUANYA MEMBUAT JALUR SURAT JALAN MUSTAHIL
   * BERHASIL:
   *
   *   1. Cabang surat jalan membaca `result.packingListID.items`, padahal di
   *      cabang itu packingListID justru null. Pembacaannya melempar galat,
   *      dan penangkapnya berupa `.catch((error) => {})` yang KOSONG —
   *      sehingga permintaannya menggantung tanpa jejak, faktur sudah terhapus
   *      tapi stok tidak pernah kembali.
   *
   *   2. Kunci lock disusun sebagai `` `x.itemID:` `` — teks apa adanya, bukan
   *      template. Seluruh barang memetakan ke satu kunci yang sama, sehingga
   *      kuncinya tidak memisahkan apa pun.
   *
   * Perlu disadari: jalur surat jalan kini benar-benar mengembalikan stok,
   * sesuatu yang sebelumnya tidak pernah terjadi.
   */
  deleteByID = async (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;

    try {
      const result: any = await this.invoiceRepository.fetchByID(id);

      if (!result || result.isDelete) {
        return res.status(404).send(ErrorList["SALES_INVOICE_NOT_FOUND"]);
      }

      await this.invoiceRepository.delete(id, userID);

      const dariPackingList = Boolean(result.packingListID);
      const sumber = dariPackingList
        ? result.packingListID
        : result.deliverySlipID;

      await lock.acquire(
        sumber.items.map((x: any) => `${x.itemID}:`),
        async (done) => {
          try {
            for (const x of sumber.items as any[]) {
              /*
                Barang dari surat jalan yang sudah dikembalikan pelanggan tidak
                ikut dikembalikan ke stok — ia memang tidak pernah keluar.
              */
              const kembali = dariPackingList
                ? x.quantity
                : x.quantity - x.returned;

              await this.stockRepository.increment({
                itemID: x.itemID,
                quantity: kembali,
                storeID: null,
              });

              const stockOutData: RemoveStockOutInterface = {
                itemID: x.itemID,
                adjustmentCaseID: null,
                quantity: x.quantity,
                billID: null,
                invoiceID: id,
                storeID: null,
              };

              await queue.add("removeStockOut", stockOutData);
            }

            if (dariPackingList) {
              await this.packingListRepository.delete(sumber._id, userID);
            } else {
              await this.deliverySlipRepository.delete(sumber._id, userID);
            }

            done();
            return res.status(201).send(result);
          } catch (error) {
            done();

            new LoggerHelper({
              message: `Error on restoring stock for invoice ${error}`,
              tag: "Sales invoice",
              type: LoggerType.error,
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          }
        }
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on deleting sales invoice ${error}`,
        tag: "Sales invoice",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  deletePaymentByID = async (req: Request, res: Response) => {
    try {
      const result = await this.invoiceRepository.deletePayment(req.params.id);
      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on deleting payment ${error}`,
        tag: "Sales invoice",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default InvoiceController;
