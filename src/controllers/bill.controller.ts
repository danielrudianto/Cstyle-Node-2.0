import { Request, Response } from "express";
import { redisClient } from "../app";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { BillRepository } from "../repositories/bill.repository";
import { StockRepository } from "../repositories/stock.repository";
import lock from "../utils/lock.helper";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk nota kasir — sisi kantor.
 *
 * Nota tidak dibuat di sini. Ia lahir di perangkat kasir saat luring lalu
 * masuk lewat endpoint sinkronisasi di cashier.controller.ts. Yang ada di
 * berkas ini hanya pembacaan dan pembatalan.
 */
export class BillController {
  private billRepository: BillRepository;
  private stockRepository: StockRepository;

  constructor(billRepository: BillRepository, stockRepository: StockRepository) {
    this.billRepository = billRepository;
    this.stockRepository = stockRepository;
  }

  /**
   * Daftar nota, disaring sesuai tingkatan pemanggil.
   *
   * Tingkat akses dibaca dari cache Redis, bukan dari database — sumber yang
   * sama dipakai auth.interceptor. accessLevel 1 dianggap "pemilik", dan
   * pemilik TIDAK melihat nota yang disembunyikan dari laporan.
   */
  fetch = async (req: Request, res: Response) => {
    try {
      const data = await redisClient.get(`users:${req.body.userID}`);
      const user = JSON.parse(data!);

      const result = await this.billRepository.fetch({
        month: req.body.month,
        year: req.body.year,
        page: req.body.page,
        keyword: req.body.keyword,
        storeID: req.body.storeID as string[],
        isOwner: user.accessLevel == 1,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching bills ${error}`,
        type: LoggerType.error,
        tag: "Bill",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.billRepository.fetchByID(req.params.id);

      /* Nota yang tidak ada dibalas 200 dengan badan null, seperti sebelumnya. */
      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching bill by ID ${error}`,
        type: LoggerType.error,
        tag: "Bill",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Membatalkan nota dan mengembalikan stoknya.
   *
   * Dua hal terjadi per baris barang: jumlah berjalan di `stocks` dikembalikan,
   * dan job "removeStockOut" dikirim supaya sisa FIFO ikut dipulihkan sehingga
   * harga pokoknya batal.
   */
  deleteByID = async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const bill: any = await this.billRepository.fetchByID(id);

      if (!bill) {
        return res.status(404).send(ErrorList["BILL_NOT_FOUND"]);
      }

      if (bill.isDelete) {
        return res.status(400).send(ErrorList["BILL_DELETED"]);
      }

      await this.billRepository.delete({ id: id, userID: req.body.userID });

      await lock.acquire(
        bill.items.map((item: any) => `${item.itemID}:${bill.storeID}`),
        async (done) => {
          try {
            /*
              Ditunggu satu per satu. Kode lama memakai forEach dengan callback
              async, sehingga done() dan balasan dikirim SEBELUM satu pun stok
              benar-benar kembali — dan kegagalannya tidak terlihat. Pola yang
              sama inilah yang membuat `stock-ins.residue` melenceng dari
              catatan stock-out-nya.
            */
            for (const x of bill.items as any[]) {
              await this.stockRepository.increment({
                itemID: x.itemID._id,
                quantity: x.quantity,
                storeID: bill.storeID,
              });

              await queue.add("removeStockOut", {
                itemID: x.itemID._id.toString(),
                adjustmentCaseID: null,
                quantity: x.quantity,
                storeID: bill.storeID,
                billID: id,
                invoiceID: null,
              });
            }

            done();
            return res.status(200).send(bill);
          } catch (error) {
            done();

            new LoggerHelper({
              message: `Error on restoring stock for bill ${error}`,
              type: LoggerType.error,
              tag: "Bill",
            }).log();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          }
        }
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on deleting bill ${error}`,
        type: LoggerType.error,
        tag: "Bill",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default BillController;
