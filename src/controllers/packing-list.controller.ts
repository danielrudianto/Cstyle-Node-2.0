import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { StockOutInterface } from "../interfaces/stock-out.interface";
import { PackingListModel } from "../models/packing-list.model";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { PackingListRepository } from "../repositories/packing-list.repository";
import { StockRepository } from "../repositories/stock.repository";
import lock from "../utils/lock.helper";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk packing list.
 *
 * Satu permintaan di sini menghasilkan TIGA hal sekaligus: packing list,
 * fakturnya, dan pengurangan stok. Ketiganya di koleksi yang berbeda dan
 * TIDAK dibungkus transaksi — kalau proses berhenti di tengah, dokumennya
 * tertinggal setengah jadi. Itu perilaku lama dan belum diubah.
 */
export class PackingListController {
  private packingListRepository: PackingListRepository;
  private invoiceRepository: InvoiceRepository;
  private stockRepository: StockRepository;

  constructor(
    packingListRepository: PackingListRepository,
    invoiceRepository: InvoiceRepository,
    stockRepository: StockRepository
  ) {
    this.packingListRepository = packingListRepository;
    this.invoiceRepository = invoiceRepository;
    this.stockRepository = stockRepository;
  }

  create = async (req: Request, res: Response) => {
    const date = req.body.date;

    try {
      /* Baris yang identik digabung dulu supaya stoknya dihitung sekali. */
      const modifiedItems = PackingListModel.mergeItems(
        req.body.items as any[]
      );

      /* Stok gudang pusat — storeID null, bukan "tidak ada toko". */
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

      const name = await this.packingListRepository.generateName(
        new Date(date)
      );

      const result = await this.packingListRepository.create({
        name: name,
        date: date,
        note: req.body.note,
        items: modifiedItems,
        salesID: req.body.salesID,
        customerID: req.body.customerID,
        createdBy: req.body.userID,
      });

      const invoiceName = await this.invoiceRepository.generateName(
        new Date(date)
      );

      const salesInvoice = await this.invoiceRepository.create({
        name: invoiceName,
        date: date,
        dueDate: req.body.dueDate,
        note: req.body.invoiceNote,
        packingListID: result._id,
        deliverySlipID: null,
        createdBy: req.body.userID,
        customerID: req.body.customerID,
        salesID: req.body.salesID,
      });

      await lock.acquire(
        result.items.map((x: any) => `${x.itemID}:`),
        async (done) => {
          try {
            /*
              Ditunggu satu per satu. Kode lama memakai forEach dengan callback
              async di dalam kunci, sehingga done() dan balasan dikirim SEBELUM
              satu pun stok benar-benar berkurang — dan kegagalannya tidak
              terlihat sama sekali.
            */
            for (const x of result.items as any[]) {
              const data: StockOutInterface = {
                itemID: x.itemID,
                quantity: x.quantity,
                invoiceID: salesInvoice._id,
                billID: null,
                adjustmentEventID: null,
                date: date,
                storeID: null,
              };

              await queue.add("insertStockOut", data);

              await this.stockRepository.increment({
                itemID: x.itemID,
                quantity: x.quantity * -1,
                storeID: null,
              });
            }

            done();
            return res.status(201).send(result);
          } catch (error) {
            done();

            new LoggerHelper({
              message: `Error on reducing stock for packing list ${error}`,
              type: LoggerType.error,
              tag: "Packing list",
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          }
        }
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on creating packing list ${error}`,
        type: LoggerType.error,
        tag: "Packing list",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.packingListRepository.fetch({
        keyword: req.body.keyword,
        /* Klien mengirim bulan gaya JavaScript, 0 - 11. */
        month: req.body.month + 1,
        year: req.body.year,
        status: req.body.status as string[],
        page: req.body.page,
      });

      return res.status(200).send(result);
    } catch (error) {
      /*
        Kode lama tidak memasang penangkap galat sama sekali di sini, sehingga
        kegagalan berakhir sebagai unhandled rejection dan permintaannya
        menggantung. Sekarang dibalas 500.
      */
      new LoggerHelper({
        message: `Error on fetching packing list ${error}`,
        type: LoggerType.error,
        tag: "Packing list",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const [packingList, salesInvoice] = await Promise.all([
        this.packingListRepository.fetchByID(req.params.id),
        this.invoiceRepository.fetchByPackingListID(req.params.id),
      ]);

      if (!packingList || !salesInvoice) {
        return res.status(404).send(ErrorList["PACKING_LIST_NOT_FOUND"]);
      }

      return res.status(200).send({
        packingList: packingList,
        salesInvoice: salesInvoice,
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching packing list ${error}`,
        type: LoggerType.error,
        tag: "Packing list",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default PackingListController;
