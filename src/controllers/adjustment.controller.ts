import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { StockInInterface } from "../interfaces/stock-in.interface";
import { StockOutInterface } from "../interfaces/stock-out.interface";
import { AdjustmentRepository } from "../repositories/adjustment.repository";
import { StockRepository } from "../repositories/stock.repository";
import lock from "../utils/lock.helper";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk penyesuaian stok.
 *
 * Dipakai setelah stok opname: baris positif menambah stok, baris negatif
 * menguranginya. Nilai nol ditolak.
 *
 * HARGA POKOK BARANG YANG MASUK LEWAT SINI ADALAH NOL.
 *
 * Baris positif membuat stock-in dengan `price: 0`, karena memang tidak ada
 * faktur pembelian di baliknya. Konsekuensinya nyata: barang itu masuk ke
 * antrean FIFO sebagai lapisan gratis, dan saat terjual nanti harga pokoknya
 * tercatat nol — menaikkan laba kotor pada laporan. Itu keputusan lama yang
 * dipertahankan, tapi perlu disadari saat membaca laporan HPP.
 */
export class AdjustmentController {
  private adjustmentRepository: AdjustmentRepository;
  private stockRepository: StockRepository;

  constructor(
    adjustmentRepository: AdjustmentRepository,
    stockRepository: StockRepository
  ) {
    this.adjustmentRepository = adjustmentRepository;
    this.stockRepository = stockRepository;
  }

  create = async (req: Request, res: Response) => {
    const items = req.body.items as any[];
    const store = req.body.store;
    const date = req.body.date;

    if (items.filter((x) => x.quantity == 0).length > 0) {
      return res.status(400).send(ErrorList["BAD_REQUEST"]);
    }

    try {
      /*
        Balasan dikirim SEKALI, dari luar kunci.

        Kode lama membalas dari DALAM callback kunci lalu membalas lagi di
        .then() sesudahnya — pada jalur stok kurang, itu berarti res.send()
        dipanggil dua kali dan Express melempar ERR_HTTP_HEADERS_SENT. Di sini
        callback hanya MENGEMBALIKAN hasil, dan pengiriman balasan dikerjakan
        setelahnya.
      */
      const hasil = await lock.acquire(
        items.map((x) => `${x.id}:${store == null ? "" : store}`),
        async () => {
          const negativeItems = items.filter((x) => x.quantity < 0);

          if (!(await this.hasEnoughStock(negativeItems, store))) {
            return { cukup: false as const };
          }

          const name = await this.adjustmentRepository.generateName(
            new Date(date)
          );

          const result = await this.adjustmentRepository.create({
            date: new Date(date),
            name: name,
            storeID: store,
            items: items.map((x) => ({
              /* Klien mengirim `id`, dokumen menyimpannya sebagai `itemID`. */
              itemID: x.id,
              quantity: x.quantity,
            })),
            createdBy: req.body.userID,
          });

          /*
            Ditunggu satu per satu. Kode lama memakai forEach dengan callback
            async, sehingga kuncinya dilepas sebelum satu pun stok bergerak.
          */
          for (const x of items) {
            await this.stockRepository.increment({
              itemID: x.id,
              quantity: x.quantity,
              storeID: store,
            });

            if (x.quantity < 0) {
              const stockOutData: StockOutInterface = {
                itemID: x.id,
                quantity: Math.abs(x.quantity),
                adjustmentEventID: result._id,
                storeID: store,
                date: date,
                billID: null,
                invoiceID: null,
              };

              await queue.add("insertStockOut", stockOutData);
            } else {
              const stockInData: StockInInterface = {
                itemID: x.id,
                quantity: x.quantity,
                residue: x.quantity,
                /* Tidak ada faktur pembelian — lihat catatan di atas kelas. */
                price: 0,
                adjustmentEventID: result._id,
                goodReceiptID: null,
                storeID: store,
                date: date,
              };

              await queue.add("insertStockIn", stockInData);
            }
          }

          return { cukup: true as const, result };
        }
      );

      if (!hasil.cukup) {
        return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
      }

      return res.status(201).send(hasil.result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on creating adjustment event: ${error}`,
        type: LoggerType.error,
        tag: "Adjustment",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.adjustmentRepository.fetch({
        page: req.body.page,
        /* Klien mengirim bulan gaya JavaScript, 0 - 11. */
        month: req.body.month + 1,
        year: req.body.year,
        keyword: req.body.keyword,
        status: req.body.status as string[],
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching adjustment event: ${error}`,
        type: LoggerType.error,
        tag: "Adjustment",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.adjustmentRepository.fetchByID(req.params.id);
      if (!result) {
        return res.status(404).send(ErrorList["ADJUSTMENT_EVENT_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching adjustment event: ${error}`,
        tag: "Adjustment",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Membatalkan penyesuaian.
   *
   * Pembatalan menarik kembali apa yang dulu ditambahkan, jadi yang perlu
   * diperiksa adalah baris POSITIF: stok yang dulu masuk harus masih ada untuk
   * bisa ditarik. Baris negatif tidak perlu diperiksa — mengembalikan stok
   * selalu bisa.
   */
  deleteByID = async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const adjustmentEvent: any = await this.adjustmentRepository.fetchByID(
        id
      );

      if (!adjustmentEvent || adjustmentEvent.isDelete) {
        return res.status(404).send(ErrorList["ADJUSTMENT_EVENT_NOT_FOUND"]);
      }

      const storeID =
        adjustmentEvent.storeID == null
          ? null
          : adjustmentEvent.storeID._id;

      const barisPositif = (adjustmentEvent.items as any[]).filter(
        (x) => x.quantity > 0
      );

      const hasil = await lock.acquire(
        barisPositif.map(
          (x: any) =>
            `${x.itemID._id.toString()}:${storeID == null ? "" : storeID}`
        ),
        async () => {
          const stocks = await this.stockRepository.fetchByItemIDs(
            barisPositif.map((x: any) => ({
              itemID: x.itemID._id,
              quantity: x.quantity,
            })),
            storeID
          );

          const cukup = barisPositif.every((x: any) => {
            const stok = stocks.find(
              (y: any) => y.itemID.toString() == x.itemID._id.toString()
            );

            return stok != undefined && stok.quantity >= x.quantity;
          });

          if (!cukup) {
            return { cukup: false as const };
          }

          const result: any = await this.adjustmentRepository.delete(
            id,
            req.body.userID
          );

          /* Seluruh baris dibalik tandanya, positif maupun negatif. */
          for (const x of result.items as any[]) {
            await this.stockRepository.increment({
              itemID: x.itemID._id ?? x.itemID,
              storeID: storeID,
              quantity: x.quantity * -1,
            });
          }

          /* Worker yang membereskan sisi FIFO-nya. */
          await queue.add("deleteAdjustment", { id: id });

          return { cukup: true as const, result };
        }
      );

      if (!hasil.cukup) {
        return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
      }

      return res.status(200).send(hasil.result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on deleting adjustment event: ${error}`,
        type: LoggerType.error,
        tag: "Adjustment",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Memeriksa stok cukup untuk baris-baris NEGATIF.
   *
   * `quantity` di sini bernilai negatif, jadi jumlah yang dibutuhkan adalah
   * kebalikannya.
   */
  private hasEnoughStock = async (
    negativeItems: { id: string; quantity: number }[],
    storeID: string | null
  ): Promise<boolean> => {
    const stocks = await this.stockRepository.fetchByItemIDs(
      negativeItems.map((x) => ({
        itemID: x.id,
        quantity: x.quantity * -1,
      })),
      storeID
    );

    return negativeItems.every((x) => {
      const stok = stocks.find((y) => y.itemID.toString() == x.id);
      return stok != undefined && stok.quantity >= x.quantity * -1;
    });
  };
}

export default AdjustmentController;
