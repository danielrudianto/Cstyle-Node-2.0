import { Request, Response } from "express";
import fs from "fs";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { ItemRepository } from "../repositories/item.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import { StockRepository } from "../repositories/stock.repository";
import { StoreRepository } from "../repositories/store.repository";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk barang.
 *
 * Controller ini menyentuh empat koleksi sekaligus — barang, stok, toko, dan
 * antrian migrasi — karena satu layar di aplikasi memang menggabungkan
 * keempatnya. Penggabungan itu dikerjakan di sini, bukan di dalam salah satu
 * repository.
 *
 * BERKAS GAMBAR MASIH DIHAPUS SECARA SINKRON.
 *
 * fs.unlinkSync() menghentikan seluruh event loop selama operasi berkasnya
 * berjalan, dan melempar galat kalau berkasnya sudah tidak ada. Keduanya
 * dipertahankan apa adanya di sini; menggantinya dengan versi asinkron
 * mengubah urutan kejadian dan itu urusan terpisah.
 */
export class ItemController {
  private itemRepository: ItemRepository;
  private migrationRepository: MigrationRepository;
  private stockRepository: StockRepository;
  private storeRepository: StoreRepository;

  constructor(
    itemRepository: ItemRepository,
    migrationRepository: MigrationRepository,
    stockRepository: StockRepository,
    storeRepository: StoreRepository
  ) {
    this.itemRepository = itemRepository;
    this.migrationRepository = migrationRepository;
    this.stockRepository = stockRepository;
    this.storeRepository = storeRepository;
  }

  create = async (req: Request, res: Response) => {
    const data = req.body;
    const item = JSON.parse(data.item);
    const images = data.images as string[];

    try {
      if (await this.itemRepository.isReferenceTaken(item.reference)) {
        /* Gambar yang terlanjur terunggah dibuang lagi. */
        for (const image of images) {
          fs.unlinkSync(image);
        }

        return res.status(400).send(ErrorList["ITEM_ALREADY_EXIST"]);
      }

      const result = await this.itemRepository.create({
        reference: item.reference,
        description: item.description,
        itemTypeID: item.itemTypeID,
        itemBrandID: item.itemBrandID,
        createdBy: data.userID,
        price: item.price,
        barcode: item.barcode,
        isFavorite: false,
        images: images,
        isActive: true,
      });

      await queue.add("createProduct", { id: result._id });

      /*
        Job "createProductImage" TIDAK ADA penanganannya di worker.ts — nama
        yang dikenal worker hanya "updateProductImage". Akibatnya gambar pada
        produk yang BARU dibuat tidak pernah ikut tercatat ke antrian migrasi,
        jadi tidak sampai ke aplikasi kasir. Dipertahankan apa adanya; ini
        cacat perilaku yang perlu diperbaiki terpisah.
      */
      if (images.length > 0) {
        await queue.add("createProductImage", { id: result._id });
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on creating item ${error}`,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  update = async (req: Request, res: Response) => {
    if (!("item" in req.body)) {
      return res.status(400).send(ErrorList["BAD_REQUEST"]);
    }

    const item = JSON.parse(req.body.item);
    const newImages = req.body.images;

    try {
      const taken = await this.itemRepository.isReferenceTakenByOther(
        item.reference,
        item.id
      );

      if (taken) {
        return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
      }

      const product = await this.itemRepository.fetchByID(item.id);
      if (!product) {
        return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
      }

      const result = await this.itemRepository.update({
        _id: item.id,
        reference: item.reference,
        description: item.description,
        itemTypeID: item.itemTypeID,
        itemBrandID: item.itemBrandID,
        price: item.price,
        barcode: item.barcode,
        images: [...product.images, ...newImages],
        isActive: item.isActive,
      });

      await queue.add("updateProduct", { id: item.id });

      if (newImages.length > 0) {
        await queue.add("updateProductImage", {
          id: item.id,
          images: newImages,
        });
      }

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on updating item ${error}`,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  updateFavoriteStatus = async (req: Request, res: Response) => {
    try {
      const result = await this.itemRepository.updateFavoriteStatus({
        id: req.body.itemID,
        isFavorite: req.body.isFavorite,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on updating item favorite status ${error}`,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  updatePrice = async (req: Request, res: Response) => {
    try {
      const result = await this.itemRepository.updatePrice(req.body.items);
      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on updating price ${error}`,
        tag: "Item",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  deleteByID = async (req: Request, res: Response) => {
    try {
      /*
        Pemeriksaan ini pada praktiknya tidak pernah menahan apa pun — lihat
        catatan isReferenced() di item.repository.ts.
      */
      if (await this.itemRepository.isReferenced(req.params.id)) {
        return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
      }

      const result = await this.itemRepository.delete({
        id: req.params.id,
        userID: req.body.userID,
      });

      if (result == null) {
        return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
      }

      for (const image of result.images) {
        fs.unlinkSync(image);
      }

      await queue.add("deleteProduct", { id: req.params.id });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on deleting item ${error}`,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Menghapus satu berkas gambar milik satu barang.
   *
   * PERINGATAN: nama berkas diambil langsung dari alamat permintaan lalu
   * disambung ke "upload/" tanpa dibersihkan, sehingga alamat yang memuat
   * "../" bisa menunjuk berkas di luar folder unggahan. Ini cacat keamanan
   * yang SUDAH ADA dan sengaja tidak diperbaiki di sini supaya refactor ini
   * tidak mencampur perubahan perilaku — tapi ia perlu ditutup segera, dan
   * perbaikannya adalah memvalidasi nama berkas, bukan memindahkannya.
   */
  deleteImage = async (req: Request, res: Response) => {
    const fileName = req.params.name;
    const itemID = req.params.id;

    if (!fs.existsSync(`upload/${fileName}`)) {
      return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
    }

    fs.unlinkSync(`upload/${fileName}`);

    try {
      const [result] = await Promise.all([
        this.itemRepository.deleteImage(`upload/${fileName}`, itemID),
        this.migrationRepository.deleteProductImage(
          `upload/${fileName}`,
          itemID
        ),
      ]);

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on deleting item image ${error}`,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.itemRepository.fetch({
        keyword: !req.query.keyword ? "" : (req.query.keyword as string),
        page: !req.query.page ? 1 : parseInt(req.query.page as string),
        onlyActive: false,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching item ${error}`,
        type: LoggerType.error,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Unduhan penuh untuk aplikasi kasir: seluruh barang beserta stoknya di
   * setiap toko.
   *
   * Stok dikelompokkan lebih dulu ke dalam Map, bukan disaring ulang untuk
   * tiap barang. Cara lama menelusuri seluruh larik stok sekali untuk setiap
   * barang, sehingga biayanya tumbuh mengikuti perkalian jumlah barang dan
   * jumlah baris stok.
   */
  downloadForCashier = async (req: Request, res: Response) => {
    try {
      const [items, stocks, stores] = await Promise.all([
        this.itemRepository.fetchInitial(),
        this.stockRepository.fetchInitial(),
        this.storeRepository.fetchOthers(null),
      ]);

      const stockByItem = new Map<string, any[]>();
      for (const stock of stocks) {
        const key = stock.itemID.toString();
        const bucket = stockByItem.get(key);
        if (bucket) {
          bucket.push(stock);
        } else {
          stockByItem.set(key, [stock]);
        }
      }

      return res.status(200).send({
        store: stores,
        data: items.map((item) => ({
          id: item._id,
          reference: item.reference,
          description: item.description,
          brand: item.itemBrandID.name,
          type: item.itemTypeID.name,
          stock: (stockByItem.get(item._id.toString()) ?? []).map((x) => ({
            quantity: x.quantity,
            storeID: x.storeID,
          })),
        })),
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching item stock ${error}`,
        tag: "Item",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  download = async (req: Request, res: Response) => {
    try {
      const result = await this.itemRepository.download();
      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on downloading item ${error}`,
        type: LoggerType.error,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByBranch = async (req: Request, res: Response) => {
    try {
      const result = await this.itemRepository.fetchWithStock({
        keyword: req.body.keyword,
        page: req.body.page,
        branch: req.body.branch,
        onlyActive: !req.body.onlyActive ? false : req.body.onlyActive,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching item ${error}`,
        type: LoggerType.error,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchPrice = async (req: Request, res: Response) => {
    try {
      const result = await this.itemRepository.fetchPrices({
        brand: req.body.brand,
        type: req.body.type,
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching item price ${error}`,
        type: LoggerType.error,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const x = await this.itemRepository.fetchByID(req.params.id);
      if (!x) {
        return res.status(404).send(ErrorList["ITEM_NOT_FOUND"]);
      }

      return res.status(200).send({
        _id: req.params.id,
        reference: x.reference,
        description: x.description,
        createdAt: x.createdAt,
        createdBy: x.createdBy,
        images: (x.images as string[]).map(
          (z) => `${process.env.BASE_URL}/${z}`
        ),
        brandID: (x.itemBrandID as any)._id,
        typeID: (x.itemTypeID as any)._id,
        itemBrand: {
          name: (x.itemBrandID as any).name,
          _id: (x.itemBrandID as any)._id,
        },
        itemType: {
          name: (x.itemTypeID as any).name,
          description: (x.itemTypeID as any).description,
          _id: (x.itemTypeID as any)._id,
        },
        price: x.price,
        barcode: x.barcode,
        isActive: x.isActive,
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching item ${error}`,
        type: LoggerType.error,
        tag: "Item",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default ItemController;
