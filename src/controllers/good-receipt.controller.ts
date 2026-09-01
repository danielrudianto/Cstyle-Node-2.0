import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { GoodReceiptStatus } from "../interfaces/good-receipt.interface";
import { LoggerType } from "../interfaces/logger.interface";
import { StockInInterface } from "../interfaces/stock-in.interface";
import { RemoveStockInInterface } from "../interfaces/stock-out.interface";
import { GoodReceiptModel } from "../models/good-receipt.model";
import { GoodReceiptRepository } from "../repositories/good-receipt.repository";
import { StockRepository } from "../repositories/stock.repository";
import lock from "../utils/lock.helper";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk penerimaan barang.
 *
 * SATU-SATUNYA PINTU MASUK BARANG.
 *
 * Setiap baris di sini melahirkan satu baris `stock-ins` lewat job
 * "insertStockIn", dan harga pada baris itu menjadi dasar seluruh perhitungan
 * harga pokok. Karena itu setiap perubahan di sini menyentuh dua tempat
 * sekaligus: jumlah berjalan di `stocks`, dan antrean biaya FIFO.
 *
 * POTONGAN HARGA ADA DUA BENTUK, DAN MUDAH TERTUKAR:
 *
 *   - Klien mengirim `discount` sebagai PERSEN.
 *   - Dokumen menyimpan `discount` sebagai RUPIAH per satuan.
 *   - `stock-ins.price` menyimpan harga SETELAH potongan.
 *
 * Ketiganya dihitung dari angka persen yang sama. Lihat GoodReceiptModel.netPrice().
 */
export class GoodReceiptController {
  private goodReceiptRepository: GoodReceiptRepository;
  private stockRepository: StockRepository;

  constructor(
    goodReceiptRepository: GoodReceiptRepository,
    stockRepository: StockRepository
  ) {
    this.goodReceiptRepository = goodReceiptRepository;
    this.stockRepository = stockRepository;
  }

  create = async (req: Request, res: Response) => {
    const items = req.body.items as any[];
    const date = req.body.date;

    try {
      const result = await this.goodReceiptRepository.create({
        name: req.body.name,
        date: date,
        supplierID: req.body.supplier,
        createdBy: req.body.userID,
        items: items.map((x) => ({
          /* Klien mengirim `id`, dokumen menyimpannya sebagai `itemID`. */
          itemID: x.id,
          quantity: x.quantity,
          price: x.price,
          discount: (x.price * x.discount) / 100,
        })),
      });

      await lock.acquire(
        items.map((x: any) => `${x.id}:`),
        async (done) => {
          try {
            /*
              Ditunggu satu per satu. Kode lama memakai forEach dengan callback
              async, sehingga done() dan balasan dikirim SEBELUM satu pun stok
              bertambah dan satu pun job masuk antrian.
            */
            for (const x of items) {
              await this.stockRepository.increment({
                itemID: x.id,
                quantity: x.quantity,
                storeID: null,
              });

              const stockInData: StockInInterface = {
                itemID: x.id,
                quantity: x.quantity,
                residue: x.quantity,
                price: GoodReceiptModel.netPrice(x.price, x.discount),
                adjustmentEventID: null,
                goodReceiptID: result._id,
                storeID: null,
                date: date,
              };

              await queue.add("insertStockIn", stockInData);
            }

            done();
            return res.status(201).send(result);
          } catch (error) {
            done();

            new LoggerHelper({
              message: `Error on adding stock for good receipt ${error}`,
              tag: "GoodReceipt",
              type: LoggerType.error,
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          }
        }
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on creating good receipt ${error}`,
        tag: "GoodReceipt",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.goodReceiptRepository.fetch({
        keyword: req.body.keyword,
        /* Klien mengirim bulan gaya JavaScript, 0 - 11. */
        month: req.body.month + 1,
        year: req.body.year,
        page: req.body.page,
        status: req.body.status as GoodReceiptStatus[],
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching good receipt ${error}`,
        tag: "GoodReceipt",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.goodReceiptRepository.fetchByID(req.params.id);
      if (!result) {
        return res.status(404).send(ErrorList["GOOD_RECEIPT_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching good receipt ${error}`,
        tag: "Good receipt",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Mengganti isi penerimaan barang.
   *
   * Prosesnya bukan "sunting" melainkan BATAL LALU BUAT ULANG: seluruh baris
   * lama ditarik kembali dari stok dan antrean FIFO, lalu baris baru dimasukkan
   * dari nol. Karena itu perlu diperiksa dulu apakah stoknya masih cukup untuk
   * ditarik — barang yang sudah terlanjur terjual tidak bisa dibatalkan.
   */
  updateByID = async (req: Request, res: Response) => {
    const id = req.body.id;
    const newItems = req.body.items as any[];
    const date = req.body.date;

    try {
      const result: any = await this.goodReceiptRepository.fetchByID(id);
      if (!result || result.isDelete) {
        return res.status(404).send(ErrorList["GOOD_RECEIPT_ALREADY_DELETED"]);
      }

      const items = result.items as any[];
      const stocks = await this.stockRepository.fetchByItemIDs(
        items.map((x: any) => ({
          itemID: x.itemID,
          quantity: x.quantity,
        })),
        null
      );

      /*
        Untuk tiap baris lama: berapa yang harus ditarik dari stok? Kalau
        barangnya masih ada di daftar baru, yang ditarik hanya selisihnya.
      */
      const cukup = items.every((lama: any) => {
        const stok = stocks.find(
          (x: any) => x.itemID.toString() == lama.itemID._id.toString()
        );

        if (!stok) return false;

        const baru = newItems.find(
          (x: any) => x.itemID == lama.itemID._id.toString()
        );

        const perluDitarik = baru
          ? lama.quantity - baru.quantity
          : lama.quantity;

        return stok.quantity >= perluDitarik;
      });

      if (!cukup) {
        return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
      }

      const goodReceipt = await this.goodReceiptRepository.update({
        _id: id,
        name: req.body.name,
        supplierID: req.body.supplier,
        date: date,
        items: newItems.map((x: any) => ({
          itemID: x.itemID,
          quantity: x.quantity,
          price: x.price,
          discount: (x.price * x.discount) / 100,
        })),
        createdBy: req.body.userID,
      });

      /* Kunci gabungan barang lama DAN baru, supaya tidak ada yang terlewat. */
      const kunci = new Set<string>([
        ...newItems.map((x: any) => x.itemID),
        ...items.map((x: any) => x.itemID._id.toString()),
      ]);

      await lock.acquire(
        [...kunci].map((x) => `${x}:`),
        async (done) => {
          try {
            /* Tarik seluruh baris lama. */
            for (const lama of items) {
              const data: RemoveStockInInterface = {
                itemID: lama.itemID,
                quantity: lama.quantity,
                goodReceiptID: id,
                adjustmentCaseID: null,
                storeID: null,
              };

              await queue.add("removeStockIn", data);
              await this.stockRepository.increment({
                quantity: lama.quantity * -1,
                itemID: lama.itemID,
                storeID: null,
              });
            }

            /* Masukkan seluruh baris baru. */
            for (const baru of newItems) {
              const data: StockInInterface = {
                goodReceiptID: id,
                itemID: baru.itemID,
                quantity: baru.quantity,
                price: GoodReceiptModel.netPrice(baru.price, baru.discount),
                residue: baru.quantity,
                adjustmentEventID: null,
                storeID: null,
                date: new Date(date),
              };

              await queue.add("insertStockIn", data);
              await this.stockRepository.increment({
                quantity: baru.quantity,
                itemID: baru.itemID,
                storeID: null,
              });
            }

            done();
            return res.status(201).send(goodReceipt);
          } catch (error) {
            done();

            new LoggerHelper({
              message: `Error on reapplying stock for good receipt ${error}`,
              tag: "Good receipt",
              type: LoggerType.error,
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          }
        }
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on updating good receipt document ${error}`,
        tag: "Good receipt",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  deleteByID = async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const goodReceipt: any = await this.goodReceiptRepository.fetchByID(id);

      if (!goodReceipt) {
        return res.status(404).send(ErrorList["GOOD_RECEIPT_NOT_FOUND"]);
      }

      if (goodReceipt.isDelete) {
        return res.status(404).send(ErrorList["GOOD_RECEIPT_ALREADY_DELETED"]);
      }

      await lock.acquire(
        goodReceipt.items.map((x: any) => `${x.itemID._id.toString()}:`),
        async (done) => {
          try {
            const stocks = await this.stockRepository.fetchByItemIDs(
              goodReceipt.items.map((x: any) => ({ itemID: x.itemID._id })),
              null
            );

            /* Barang yang sudah terjual tidak bisa ditarik kembali. */
            const cukup = goodReceipt.items.every((baris: any) => {
              const stok = stocks.find(
                (x: any) =>
                  x.itemID.toString() == baris.itemID._id.toString()
              );

              return stok != undefined && stok.quantity >= baris.quantity;
            });

            if (!cukup) {
              done();
              return res.status(400).send(ErrorList["INSUFFICIENT_STOCK"]);
            }

            const result = await this.goodReceiptRepository.delete(
              id,
              req.body.userID
            );

            if (!result) {
              /*
                Kode lama TIDAK memanggil done() pada cabang ini, sehingga
                kuncinya tidak pernah dilepas dan permintaan berikutnya untuk
                barang yang sama ikut tertahan. Sekarang selalu dilepas.
              */
              done();
              return res.status(404).send(ErrorList["GOOD_RECEIPT_NOT_FOUND"]);
            }

            for (const x of goodReceipt.items as any[]) {
              await this.stockRepository.increment({
                quantity: x.quantity * -1,
                itemID: x.itemID,
                storeID: null,
              });

              const data: RemoveStockInInterface = {
                itemID: x.itemID,
                quantity: x.quantity,
                goodReceiptID: id,
                adjustmentCaseID: null,
                storeID: null,
              };

              await queue.add("removeStockIn", data);
            }

            done();
            return res.status(200).send(result);
          } catch (error) {
            done();

            new LoggerHelper({
              message: `Error on deleting good receipt ${error}`,
              tag: "Good receipt",
              type: LoggerType.error,
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          }
        }
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching good receipt ${error}`,
        tag: "Good receipt",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default GoodReceiptController;
