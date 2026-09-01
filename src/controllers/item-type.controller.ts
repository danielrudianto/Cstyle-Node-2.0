import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { ItemTypeRepository } from "../repositories/item-type.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk jenis barang.
 *
 * Seperti merek barang, mengganti nama jenis harus ikut tercatat ke antrian
 * migrasi karena nama itu tersalin ke tiap baris produk di database kasir.
 * Jadi controller ini juga menerima dua repository.
 */
export class ItemTypeController {
  private itemTypeRepository: ItemTypeRepository;
  private migrationRepository: MigrationRepository;

  constructor(
    itemTypeRepository: ItemTypeRepository,
    migrationRepository: MigrationRepository
  ) {
    this.itemTypeRepository = itemTypeRepository;
    this.migrationRepository = migrationRepository;
  }

  create = async (req: Request, res: Response) => {
    try {
      /*
        Pemeriksaan nama ganda ini pada praktiknya tidak pernah gagal — lihat
        catatan isNameTaken() di item-type.repository.ts.
      */
      if (await this.itemTypeRepository.isNameTaken(req.body.name)) {
        return res.status(400).send(ErrorList["ITEM_TYPE_ALREADY_EXIST"]);
      }

      const result = await this.itemTypeRepository.create({
        name: req.body.name,
        description: req.body.description,
        createdBy: req.body.userID,
        createdAt: new Date(),
      });

      return res.status(201).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on creating item type ${error}`,
        tag: "item-type",
      }).log();

      return res.status(500).send(error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const bermasalah =
        await this.itemTypeRepository.isNameTakenByOtherOrMissing({
          name: req.body.name,
          _id: req.body.id,
        });

      if (bermasalah) {
        return res.status(404).send(ErrorList["ITEM_TYPE_NOT_FOUND"]);
      }

      const hasil = await Promise.all([
        this.itemTypeRepository.update({
          _id: req.body.id,
          name: req.body.name,
        }),
        this.migrationRepository.updateProductType({
          id: req.body.id,
          name: req.body.name,
        }),
      ]);

      /*
        Job "update-item-type" TIDAK ADA penanganannya di worker.ts — nama job
        yang dikenal worker adalah "updateProductType". Jadi job ini masuk
        antrian lalu diam di sana tanpa pernah dikerjakan.

        Tidak masalah secara fungsional, karena migrasinya sudah ditulis
        langsung di atas. Dipertahankan supaya isi antrian Redis tidak berubah;
        menghapusnya urusan pembersihan tersendiri.
      */
      await queue.add("update-item-type", {
        name: req.body.name,
        id: req.body.id,
      });

      /*
        `hasil` adalah larik dua elemen, dan menyebarkannya ke dalam objek
        menghasilkan kunci "0" dan "1" — bukan gabungan isinya. Bentuk aneh ini
        sudah dikirim ke klien sejak dulu, jadi dipertahankan apa adanya.
      */
      return res.status(201).send({
        ...hasil,
        name: req.body.name,
        description: req.body.description,
      });
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on updating item type ${error}`,
        tag: "item-type",
      }).log();

      return res.status(500).send(error);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      if (!(await this.itemTypeRepository.existsActive(req.params.id))) {
        return res.status(404).send(ErrorList["ITEM_TYPE_NOT_FOUND"]);
      }

      /*
        userID sengaja tidak diteruskan: kode lama membuat model tanpa
        createdBy, sehingga deletedBy tersimpan undefined. Mengisinya sekarang
        akan mengubah isi dokumen.
      */
      const result = await this.itemTypeRepository.delete(
        req.params.id,
        undefined as any
      );

      return res.status(201).send(result);
    } catch (error) {
      console.error(`[error]: Error on deleting item type ${error}`);
      return res.status(500).send(error);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.itemTypeRepository.fetch({
        page: req.query.page == null ? 1 : Number(req.query.page),
        keyword: req.query.keyword == null ? "" : req.query.keyword.toString(),
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching item type ${error}`,
        tag: "Item type",
      }).log();

      return res.status(500).send(error);
    }
  };

  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.itemTypeRepository.fetchByID(req.params.id);
      if (!result) {
        return res.status(404).send(ErrorList["ITEM_TYPE_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching item type ${error}`,
        tag: "Item type",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchAutocomplete = async (req: Request, res: Response) => {
    try {
      const result = await this.itemTypeRepository.fetchAutocomplete(
        req.query.keyword == null ? "" : req.query.keyword.toString()
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching item type autocomplete ${error}`,
        tag: "Item type",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(error);
    }
  };
}

export default ItemTypeController;
