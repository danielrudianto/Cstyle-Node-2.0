import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import {
  StockOutInterface,
  StockOutTempInterface,
} from "../interfaces/stock-out.interface";
import { DeliverySlipModel } from "../models/delivery-slip.model";
import { DeliverySlipRepository } from "../repositories/delivery-slip.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { StockRepository } from "../repositories/stock.repository";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk surat jalan.
 *
 * ALUR DUA TAHAP.
 *
 * Surat jalan dipakai ketika barang dikirim dulu dan belum tentu semuanya
 * terjual — sisanya bisa dikembalikan. Karena itu prosesnya dua tahap:
 *
 *   1. create()  — barang keluar gudang. Stok berkurang, tapi BELUM menjadi
 *                  penjualan: yang dicatat hanya kartu stok lewat job
 *                  "insertStockOutTemp", tanpa menyentuh antrean FIFO. Jadi
 *                  belum ada harga pokok.
 *
 *   2. confirm() — barang yang tidak kembali dinyatakan terjual. Catatan
 *                  sementara tadi dibatalkan, faktur dibuat, dan barulah
 *                  "insertStockOut" dijalankan sehingga harga pokoknya
 *                  terhitung.
 *
 * SELURUH ALUR INI BELUM PERNAH BERJALAN DI PRODUKSI — lihat catatan nama
 * koleksi di delivery-slip.repository.ts. Uji dari ujung ke ujung sebelum
 * dirilis.
 */
export class DeliverySlipController {
  private deliverySlipRepository: DeliverySlipRepository;
  private invoiceRepository: InvoiceRepository;
  private stockRepository: StockRepository;

  constructor(
    deliverySlipRepository: DeliverySlipRepository,
    invoiceRepository: InvoiceRepository,
    stockRepository: StockRepository
  ) {
    this.deliverySlipRepository = deliverySlipRepository;
    this.invoiceRepository = invoiceRepository;
    this.stockRepository = stockRepository;
  }

  create = async (req: Request, res: Response) => {
    const date = req.body.date;

    try {
      const modifiedItems = DeliverySlipModel.mergeItems(
        req.body.items as any[]
      );

      /* Stok gudang pusat — storeID null. */
      const stock = await this.stockRepository.fetchByItemIDs(
        modifiedItems.map((x) => ({
          itemID: x.itemID,
          quantity: x.quantity,
        })),
        null
      );

      const cukup = modifiedItems.every((x) => {
        const baris = stock.find((y) => y.itemID.toString() == x.itemID);
        return baris != undefined && baris.quantity >= x.quantity;
      });

      if (!cukup) {
        return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
      }

      const name = await this.deliverySlipRepository.generateName(
        new Date(date)
      );

      const result = await this.deliverySlipRepository.create({
        name: name,
        date: date,
        customerID: req.body.customerID,
        salesID: req.body.salesID,
        items: modifiedItems,
        createdBy: req.body.userID,
        note: req.body.note,
        isDelete: false,
        isReturn: false,
        deletedAt: null,
        deletedBy: null,
        returnedAt: null,
      });

      /*
        Ditunggu satu per satu. Kode lama memakai forEach dengan callback async,
        sehingga balasan dikirim sebelum job-nya benar-benar masuk antrian.
      */
      for (const x of result.items as any[]) {
        await queue.add("insertStockOutTemp", {
          itemID: x.itemID,
          quantity: x.quantity,
          deliverySlipID: result._id,
        });
      }

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on creating delivery slip ${error}`,
        tag: "Delivery slip",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.deliverySlipRepository.fetch({
        page: req.body.page,
        keyword: req.body.keyword,
        /* Klien mengirim bulan gaya JavaScript, 0 - 11. */
        month: req.body.month + 1,
        year: req.body.year,
        status: req.body.status,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching delivery slip ${error}`,
        tag: "Delivery slip",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.deliverySlipRepository.fetchByID(
        req.params.id
      );

      if (!result) {
        return res.status(404).send(ErrorList["DELIVERY_SLIP_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching delivery slip ${error}`,
        tag: "Delivery slip",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByIDWInvoice = async (req: Request, res: Response) => {
    try {
      const [deliverySlip, salesInvoice] = await Promise.all([
        this.deliverySlipRepository.fetchByID(req.params.id),
        this.invoiceRepository.fetchByDeliverySlipID(req.params.id),
      ]);

      return res.status(200).send({
        deliverySlip: deliverySlip,
        salesInvoice: salesInvoice,
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching delivery slip ${error}`,
        tag: "Delivery slip",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchUnconfirmed = async (req: Request, res: Response) => {
    try {
      const result = await this.deliverySlipRepository.fetchUnconfirmed(
        !req.query.page ? 1 : Number(req.query.page)
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching unconfirmed delivery slips ${error}`,
        tag: "Delivery slips",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Tahap kedua: menyatakan barang terjual dan menerbitkan fakturnya.
   *
   * Jumlah yang dipakai adalah `quantity` PENUH, bukan dikurangi `returned` —
   * itu perilaku kode lama dan dipertahankan, meskipun barang yang kembali
   * seharusnya tidak ikut dihitung sebagai penjualan. Perlu ditinjau bersama
   * pengguna sebelum diubah, karena menyentuh angka penjualan.
   */
  confirm = async (req: Request, res: Response) => {
    const invoiceDate = new Date(req.body.invoiceDate);
    const deliverySlipID = req.body.id;

    try {
      const existing = await this.deliverySlipRepository.fetchByID(
        deliverySlipID
      );

      if (!existing) {
        return res.status(404).send(ErrorList["DELIVERY_SLIP_NOT_FOUND"]);
      }

      if (existing.isDelete) {
        return res.status(400).send(ErrorList["DELIVERY_SLIP_DELETED"]);
      }

      if (existing.isReturn) {
        return res.status(400).send(ErrorList["DELIVERY_SLIP_RETURNED"]);
      }

      const result = await this.deliverySlipRepository.recordReturn({
        id: deliverySlipID,
        items: req.body.items,
        returnedAt: invoiceDate,
      });

      /* Catatan kartu stok sementara dari tahap pertama dibatalkan dulu. */
      for (const item of result.items as any[]) {
        const data: StockOutTempInterface = {
          date: result.date,
          quantity: item.quantity,
          itemID: item.itemID,
          deliverySlipID: deliverySlipID,
        };

        await queue.add("removeStockOutTemp", data);
      }

      const invoiceName = await this.invoiceRepository.generateName(
        invoiceDate
      );

      const salesInvoice = await this.invoiceRepository.create({
        name: invoiceName,
        date: invoiceDate,
        dueDate: new Date(req.body.invoiceDueDate),
        note: req.body.invoiceNote,
        isDelete: false,
        isHidden: false,
        deliverySlipID: deliverySlipID,
        packingListID: null,
        createdBy: req.body.userID,
        salesID: result.salesID,
        customerID: result.customerID,
      });

      /* Barulah barang keluar sungguhan, sehingga harga pokoknya terhitung. */
      for (const item of result.items as any[]) {
        const data: StockOutInterface = {
          date: invoiceDate,
          quantity: item.quantity,
          itemID: item.itemID,
          invoiceID: salesInvoice._id,
          adjustmentEventID: null,
          billID: null,
          storeID: null,
        };

        await queue.add("insertStockOut", data);
      }

      return res.status(201).send(result);
    } catch (error) {
      /*
        Kode lama tidak memasang penangkap galat pada dua rantai terluarnya,
        sehingga kegagalan berakhir sebagai unhandled rejection dan
        permintaannya menggantung. Sekarang dibalas 500.
      */
      new LoggerHelper({
        message: `Error on confirming delivery slip ${error}`,
        tag: "Delivery slip",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default DeliverySlipController;
