import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { ItemRepository } from "../repositories/item.repository";
import { StockRepository } from "../repositories/stock.repository";
import { StoreRepository } from "../repositories/store.repository";
import LoggerHelper from "../utils/logger.helper";

/**
 * Lapisan HTTP untuk stok barang.
 *
 * PERHATIAN SOAL HAK AKSES.
 *
 * Route-route ini dipasang dengan AuthInterceptor.anyIntercept, yang menerima
 * DUA cara masuk: token JWT, atau sekadar header "store" berisi kode toko.
 * Pada jalur token, `req.body.storeID` TIDAK diisi interceptor — jadi nilainya
 * datang apa adanya dari badan permintaan, dan pemanggil bebas menentukan toko
 * mana yang ingin ia lihat. Hal yang sama berlaku untuk `targetStoreID` di
 * fetchByStoreID().
 *
 * Ini cacat kontrol akses yang SUDAH ADA dan tidak diubah di sini, tapi jangan
 * dianggap aman: memperbaikinya berarti menetapkan storeID di interceptor,
 * bukan menerimanya dari klien.
 */
export class ItemStockController {
  private itemRepository: ItemRepository;
  private stockRepository: StockRepository;
  private storeRepository: StoreRepository;

  constructor(
    itemRepository: ItemRepository,
    stockRepository: StockRepository,
    storeRepository: StoreRepository
  ) {
    this.itemRepository = itemRepository;
    this.stockRepository = stockRepository;
    this.storeRepository = storeRepository;
  }

  /** Daftar barang dengan stok di toko ini dan gabungan stok di toko lain. */
  fetch = async (req: Request, res: Response) => {
    try {
      const { data: items, count: itemCount } =
        await this.itemRepository.fetch({
          keyword: req.query.keyword as string,
          page: !req.query.page ? 1 : parseInt(req.query.page.toString()),
          onlyActive: false,
        });

      const [onPremiseStock, otherStock] =
        await this.stockRepository.fetchDashboardByItemIDs(
          items.map((x) => ({ itemID: x._id, quantity: 0 })),
          req.body.storeID
        );

      const petakan = (baris: any[]) => {
        const peta = new Map<string, number>();
        for (const x of baris) {
          peta.set(x._id.toString(), x.quantity);
        }
        return peta;
      };

      const stokSini = petakan(onPremiseStock);
      const stokLain = petakan(otherStock);

      return res.status(200).send({
        data: items.map((x) => ({
          reference: x.reference,
          description: x.description,
          onPremiseStock: stokSini.get(x._id.toString()) ?? 0,
          otherStock: stokLain.get(x._id.toString()) ?? 0,
          _id: x._id,
        })),
        count: itemCount,
      });
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching item stock: ${error}`,
        tag: "ItemStockController",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Daftar barang beserta stok pada satu toko tertentu.
   *
   * Teks "null" diperlakukan sebagai gudang pusat — aplikasi kasir memang
   * mengirimkannya sebagai teks, bukan null JSON.
   */
  fetchStockByStoreID = async (req: Request, res: Response) => {
    try {
      const result = await this.itemRepository.fetchWithStock({
        page: req.body.page,
        keyword: req.body.keyword,
        branch:
          req.body.targetStoreID === "null" ? null : req.body.targetStoreID,
        onlyActive: false,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching item stock: ${error}`,
        tag: "ItemStockController",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /** Satu barang beserta sebaran stoknya di seluruh toko. */
  fetchByItemID = async (req: Request, res: Response) => {
    try {
      const [item, result] = await Promise.all([
        this.itemRepository.fetchByID(req.params.id),
        this.stockRepository.fetchByItemID(req.params.id),
      ]);

      return res.status(200).send({ item: item, stock: result });
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching item stock: ${error}`,
        tag: "ItemStockController",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /** Unduhan penuh: seluruh toko, barang, dan baris stok tanpa batas jumlah. */
  download = async (req: Request, res: Response) => {
    try {
      const [stocks, items, stores] = await Promise.all([
        this.stockRepository.fetchInitial(),
        this.itemRepository.download(),
        this.storeRepository.fetchOthers(null),
      ]);

      return res.status(200).send({
        stores: stores,
        items: items,
        stocks: stocks,
      });
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on downloading item stock: ${error}`,
        tag: "ItemStockController",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default ItemStockController;
