import { NextFunction, Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { StockRequestRepository } from "../repositories/stock-request.repository";
import { StockRepository } from "../repositories/stock.repository";
import lock from "../utils/lock.helper";
import LoggerHelper from "../utils/logger.helper";

/**
 * Lapisan HTTP untuk permintaan transfer stok antar toko.
 *
 * ARAHNYA MUDAH TERTUKAR:
 *
 *   requestFrom = toko yang MEMINTA  (tujuan barang)
 *   requestTo   = toko yang DIMINTAI (asal barang)
 *
 * Barang bergerak dari `requestTo` ke `requestFrom`.
 *
 * EMPAT TAHAP, DAN STOK BERGERAK DUA KALI:
 *
 *   create()  — permintaan dibuat. Stok BELUM bergerak.
 *   send()    — toko asal mengirim. Stok `requestTo` BERKURANG di sini.
 *   receive() — toko peminta menerima. Stok `requestFrom` BERTAMBAH.
 *   reject()  — permintaan ditolak. Stok `requestTo` DIKEMBALIKAN.
 *
 * Transfer TIDAK menyentuh antrean FIFO sama sekali — hanya jumlah berjalan di
 * `stocks`. Itu benar: memindahkan barang antar toko bukan penjualan dan bukan
 * pembelian, jadi harga pokoknya tidak berubah.
 */
export class StockRequestController {
  private stockRequestRepository: StockRequestRepository;
  private stockRepository: StockRepository;

  constructor(
    stockRequestRepository: StockRequestRepository,
    stockRepository: StockRepository
  ) {
    this.stockRequestRepository = stockRequestRepository;
    this.stockRepository = stockRepository;
  }

  create = async (req: Request, res: Response) => {
    const requestFrom =
      req.body.storeID == undefined ? null : req.body.storeID;
    const requestTo = req.body.requestTo;
    const date = new Date(req.body.date);

    if (requestFrom == requestTo) {
      return res.status(400).send(ErrorList["STOCK_REQUEST_SAME_STORE"]);
    }

    try {
      const count = await this.stockRequestRepository.countByMonthYear(
        date.getMonth() + 1,
        date.getFullYear()
      );

      /*
        Hitungannya diambil dari bulan DOKUMEN, tapi nomornya disusun dari
        bulan HARI INI — dua sumber tanggal yang berbeda. Untuk dokumen
        bertanggal mundur, nomornya jadi menyebut bulan yang salah.
        Dipertahankan karena mengubahnya menggeser penomoran yang sudah
        berjalan.
      */
      const name =
        "SR-CS-" +
        new Date().getFullYear() +
        "-" +
        (new Date().getMonth() + 1).toString().padStart(2, "0") +
        "-" +
        (count + 1).toString().padStart(4, "0");

      const result = await this.stockRequestRepository.create({
        name: name,
        date: date,
        requestFrom: requestFrom,
        requestTo: requestTo,
        /* Klien mengirim `item` (tunggal) berisi baris dengan kunci `id`. */
        items: (req.body.item as any[]).map((x) => ({
          itemID: x.id,
          quantity: x.quantity,
        })),
        note: req.body.note,
        createdBy: req.body.userID,
      });

      return res.status(201).send(result);
    } catch (error: any) {
      new LoggerHelper({
        message: `Error on creating stock request: ${error?.message}`,
        type: LoggerType.error,
        tag: "Stock request",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  search = async (req: Request, res: Response) => {
    try {
      const result = await this.stockRequestRepository.fetch({
        page: req.body.page,
        keyword: req.body.keyword as string,
        status: req.body.status as string[],
        /* Klien mengirim bulan gaya JavaScript, 0 - 11. */
        month: req.body.month + 1,
        year: req.body.year,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching stock transfer requests ${error}`,
        tag: "Stock transfer request",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchCreatedRequests = async (req: Request, res: Response) => {
    try {
      const result = await this.stockRequestRepository.fetchCreated(
        req.body.page,
        req.body.storeID as string
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching created request ${error}`,
        tag: "Stock request",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.stockRequestRepository.fetchByID(
        req.params.id
      );

      if (!result) {
        return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching stock transfer request ${error}`,
        tag: "Stock transfer request",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchUnsentRequests = async (req: Request, res: Response) => {
    try {
      const result = await this.stockRequestRepository.fetchUnsent(
        req.body.page,
        req.body.requestTo as string | null
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching unsent request ${error}`,
        tag: "Stock request",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchUnreceivedRequests = async (req: Request, res: Response) => {
    try {
      const result = await this.stockRequestRepository.fetchUnreceived(
        req.body.page,
        req.body.requestFrom as string | null
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching unreceived request ${error}`,
        tag: "Stock request",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Penjaga bersama untuk /confirm dan /reject.
   *
   * Memuat dokumennya sekali lalu menitipkannya di req.body.stockRequest,
   * supaya handler berikutnya tidak perlu mengambilnya lagi.
   */
  checkStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stockRequest = await this.stockRequestRepository.fetchByID(
        req.body.id
      );

      if (!stockRequest || stockRequest.isDelete) {
        return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
      }

      if (stockRequest.isConfirm || stockRequest.isReject) {
        return res
          .status(405)
          .send(ErrorList["STOCK_REQUEST_ALREADY_PROCESSED"]);
      }

      req.body.stockRequest = stockRequest;
      return next();
    } catch (error) {
      new LoggerHelper({
        message: `Error on checking stock request status ${error}`,
        tag: "Stock request",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Toko asal mengirim barang. Stok `requestTo` berkurang di sini.
   *
   * Jumlah yang dikirim boleh LEBIH SEDIKIT dari yang diminta, dan daftar yang
   * masuk menimpa daftar aslinya.
   */
  send = async (req: Request, res: Response) => {
    const id = req.body.id;
    const items = req.body.items as any[];

    try {
      const stockRequest: any = await this.stockRequestRepository.fetchByID(
        id
      );

      if (!stockRequest || stockRequest.isDelete) {
        return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
      }

      if (stockRequest.isConfirm || stockRequest.isReject) {
        return res
          .status(405)
          .send(ErrorList["STOCK_REQUEST_ALREADY_PROCESSED"]);
      }

      if (stockRequest.isSending) {
        return res.status(405).send(ErrorList["STOCK_REQUEST_ALREADY_SENT"]);
      }

      const hasil = await lock.acquire(
        items.map((x: any) => x.itemID.toString()),
        async () => {
          const stocks = await this.stockRepository.fetchByItemIDs(
            items.map((x: any) => ({
              itemID: x.itemID,
              quantity: x.quantity,
            })),
            stockRequest.requestTo
          );

          const cukup = items.every((x: any) => {
            const stok = stocks.find(
              (y: any) => y.itemID.toString() == x.itemID
            );

            return stok != undefined && stok.quantity >= x.quantity;
          });

          if (!cukup) {
            return { cukup: false as const };
          }

          const result = await this.stockRequestRepository.send({
            id: id,
            createdBy: req.body.userID,
            items: items,
          });

          /*
            Ditunggu satu per satu. Kode lama memakai forEach dengan callback
            async, sehingga kunci dilepas dan balasan dikirim sebelum satu pun
            stok berkurang.
          */
          for (const x of items) {
            await this.stockRepository.increment({
              storeID: stockRequest.requestTo,
              itemID: x.itemID,
              quantity: x.quantity * -1,
            });
          }

          return { cukup: true as const, result };
        }
      );

      if (!hasil.cukup) {
        return res.status(405).send(ErrorList["INSUFFICIENT_STOCK"]);
      }

      return res.status(201).send(hasil.result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on sending stock request ${error}`,
        tag: "StockRequest",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /** Toko peminta menerima barang. Stok `requestFrom` bertambah. */
  confirm = async (req: Request, res: Response) => {
    const id = req.body.id;
    const stockRequest = req.body.stockRequest;

    try {
      const result = await this.stockRequestRepository.confirm(
        id,
        req.body.userID
      );

      await lock.acquire(
        stockRequest.items.map(
          (x: any) =>
            `${x.itemID}:${
              stockRequest.requestFrom == null ? "" : stockRequest.requestFrom
            }`
        ),
        async (done) => {
          try {
            for (const x of stockRequest.items as any[]) {
              await this.stockRepository.increment({
                itemID: x.itemID,
                quantity: x.quantity,
                storeID: stockRequest.requestFrom,
              });
            }

            done();
            return res.status(201).send(result);
          } catch (error) {
            done();
            throw error;
          }
        }
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on confirming stock request ${error}`,
        tag: "Stock request",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Jalur penerimaan dari aplikasi kasir.
   *
   * Berbeda dari confirm() yang dipakai kantor: di sini dokumennya diambil
   * sendiri dan pemeriksaannya lebih lengkap.
   */
  receive = async (req: Request, res: Response) => {
    const id = req.body.id;

    try {
      const stockRequest: any = await this.stockRequestRepository.fetchByID(
        id
      );

      /*
        Kode lama menulis `stockRequest.iDelete` — salah ketik, bidangnya
        `isDelete`. Nilainya selalu undefined, jadi permintaan yang SUDAH
        DIHAPUS tetap bisa diterima dan stoknya tetap bertambah. Diperbaiki.
      */
      if (!stockRequest || stockRequest.isDelete) {
        return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
      }

      if (!stockRequest.isSending) {
        return res.status(400).send(ErrorList["STOCK_REQUEST_NOT_SENT"]);
      }

      if (stockRequest.isConfirm || stockRequest.isReject) {
        return res
          .status(400)
          .send(ErrorList["STOCK_REQUEST_ALREADY_CONFIRMED"]);
      }

      await this.stockRequestRepository.confirm(id, req.body.userID);

      await lock.acquire(
        stockRequest.items.map(
          (x: any) => `${x.itemID._id}:${stockRequest.requestFrom}`
        ),
        async (done) => {
          try {
            for (const x of stockRequest.items as any[]) {
              await this.stockRepository.increment({
                itemID: x.itemID._id,
                quantity: x.quantity,
                storeID: stockRequest.requestFrom,
              });
            }

            done();
            return res.status(201).send(stockRequest);
          } catch (error) {
            done();
            throw error;
          }
        }
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on receiving stock request ${error}`,
        tag: "Stock request",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Menolak permintaan. Stok yang sudah dikirim dikembalikan ke `requestTo`.
   *
   * CATATAN: catatan penolakannya dibaca dari `req.body.reason`, padahal
   * route-nya memvalidasi `rejectNote`. Jadi yang tersimpan selalu undefined
   * sementara klien tetap wajib mengirim `rejectNote`. Salah satu dari
   * keduanya perlu diselaraskan — dan itu perubahan perilaku, jadi belum
   * disentuh di sini.
   */
  reject = async (req: Request, res: Response) => {
    try {
      const result: any = await this.stockRequestRepository.reject(
        req.body.id,
        req.body.userID,
        req.body.reason
      );

      await lock.acquire(
        result.items.map((x: any) => x.itemID),
        async (done) => {
          try {
            for (const x of result.items as any[]) {
              await this.stockRepository.increment({
                itemID: x.itemID,
                quantity: x.quantity,
                storeID: result.requestTo,
              });
            }

            done();
            return res.status(201).send(result);
          } catch (error) {
            done();
            throw error;
          }
        }
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on rejecting stock transfer request ${error}`,
        tag: "Stock transfer request",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Membatalkan permintaan yang BELUM dikirim.
   *
   * Kode lama punya dua lubang di sini: cabang `isReject` isinya KOSONG, dan
   * tidak ada cabang sama sekali untuk permintaan yang sudah dikirim. Pada
   * kedua keadaan itu permintaan menggantung tanpa balasan. Sekarang keduanya
   * dijawab 400 dengan pesan yang jelas.
   */
  deleteByID = async (req: Request, res: Response) => {
    try {
      const stockRequest = await this.stockRequestRepository.fetchByID(
        req.params.id
      );

      if (!stockRequest || stockRequest.isDelete) {
        return res.status(404).send(ErrorList["STOCK_REQUEST_NOT_FOUND"]);
      }

      if (stockRequest.isReject || stockRequest.isConfirm) {
        return res
          .status(400)
          .send(ErrorList["STOCK_REQUEST_ALREADY_PROCESSED"]);
      }

      if (stockRequest.isSending) {
        return res.status(400).send(ErrorList["STOCK_REQUEST_ALREADY_SENT"]);
      }

      const result = await this.stockRequestRepository.delete(
        req.params.id,
        req.body.userID
      );

      return res.status(201).send(result);
    } catch (error: any) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on deleting stock request: ${error?.message}`,
        tag: "Stock request",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default StockRequestController;
