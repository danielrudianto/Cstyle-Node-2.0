import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { ItemBrandRepository } from "../repositories/item-brand.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import LoggerHelper from "../utils/logger.helper";

/**
 * Lapisan HTTP untuk merek barang.
 *
 * Controller ini menerima DUA repository. Mengganti nama merek tidak hanya
 * menyentuh koleksi `itembrands`: nama merek ikut tersalin ke tiap baris
 * produk di database kasir, jadi perubahannya harus dicatat ke antrian
 * migrasi juga. Karena keduanya adalah koleksi yang berbeda, penggabungannya
 * dikerjakan di sini — bukan di dalam salah satu repository.
 */
export class ItemBrandController {
  private itemBrandRepository: ItemBrandRepository;
  private migrationRepository: MigrationRepository;

  constructor(
    itemBrandRepository: ItemBrandRepository,
    migrationRepository: MigrationRepository
  ) {
    this.itemBrandRepository = itemBrandRepository;
    this.migrationRepository = migrationRepository;
  }

  create = async (req: Request, res: Response) => {
    try {
      /*
        Pemeriksaan nama ganda ini pada praktiknya tidak pernah gagal — lihat
        catatan nomor 1 di item-brand.repository.ts. Tetap dipanggil supaya
        perilakunya sama persis dengan sebelumnya.
      */
      if (await this.itemBrandRepository.isNameTaken(req.body.name)) {
        return res.status(404).send(ErrorList["ITEM_BRAND_ALREADY_EXIST"]);
      }

      const result = await this.itemBrandRepository.create({
        name: req.body.name,
        createdBy: req.body.userID,
        createdAt: new Date(),
      });

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on creating item brand ${error}`,
        tag: "Item-brand",
      }).log();

      return res.status(500).send(error);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.itemBrandRepository.fetch({
        page: req.query.page == null ? 1 : Number(req.query.page),
        keyword: req.query.keyword == null ? "" : req.query.keyword.toString(),
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching item brand ${error}`,
        tag: "Item-brand",
      }).log();

      return res.status(500).send(error);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.itemBrandRepository.fetchByID(req.params.id);

      /*
        Merek yang tidak ditemukan tetap dibalas 200 dengan badan null, sama
        seperti sebelumnya. Membalas 404 di sini akan mengubah perilaku klien.
      */
      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching item brand by ID ${error}`,
        tag: "Item-brand",
      }).log();

      return res.status(500).send(error);
    }
  };

  fetchAutocomplete = async (req: Request, res: Response) => {
    try {
      const result = await this.itemBrandRepository.fetchAutocomplete(
        req.query.keyword == null ? "" : req.query.keyword.toString()
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching item brand autocomplete ${error}`,
        tag: "Item-brand",
      }).log();

      return res.status(500).send(error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      /*
        Pesan ITEM_BRAND_ALREADY_EXIST di sini keliru — yang diperiksa adalah
        keberadaan mereknya, bukan nama ganda. Dipertahankan karena pesannya
        sudah dikenal klien.
      */
      if (!(await this.itemBrandRepository.existsActive(req.body.id))) {
        return res.status(404).send(ErrorList["ITEM_BRAND_ALREADY_EXIST"]);
      }

      const [result] = await Promise.all([
        this.itemBrandRepository.update({
          _id: req.body.id,
          name: req.body.name,
        }),
        this.migrationRepository.updateProductBrand({
          id: req.body.id,
          name: req.body.name,
        }),
      ]);

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on updating item brand ${error}`,
        tag: "Item-brand",
      }).log();

      return res.status(500).send(error);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      if (!(await this.itemBrandRepository.exists(req.params.id))) {
        return res.status(404).send(ErrorList["ITEM_BRAND_NOT_FOUND"]);
      }

      const result = await this.itemBrandRepository.delete(
        req.params.id,
        req.body.userID
      );

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on deleting item brand ${error}`,
        tag: "Item-brand",
      }).log();

      return res.status(500).send(error);
    }
  };
}

export default ItemBrandController;
