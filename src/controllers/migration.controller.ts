import { Request, Response } from "express";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { ItemRepository } from "../repositories/item.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import { UserRepository } from "../repositories/user.repository";
import LoggerHelper from "../utils/logger.helper";

/**
 * Lapisan HTTP untuk sinkronisasi aplikasi kasir.
 *
 * Aplikasi kasir mengirim nomor versi terakhir yang ia punya, dan menerima
 * daftar perintah SQL untuk dijalankan pada SQLite lokalnya.
 *
 * DUA HAL YANG PERLU DIINGAT SOAL ENDPOINT INI.
 *
 * Pertama, route-nya TIDAK memakai autentikasi apa pun. Siapa pun yang bisa
 * menjangkau server ini bisa mengirim `last_migration_version: 0` dan menerima
 * seluruh katalog produk beserta daftar pengguna — nama, kode pegawai, dan id.
 *
 * Kedua, perintah SQL-nya dirangkai dengan penggabungan string, dan
 * escape-nya memakai .replace("'", "''") yang HANYA mengganti kemunculan
 * PERTAMA — tanpa penanda global. Nama produk dengan dua tanda kutip sudah
 * cukup untuk merusak perintah yang dijalankan di perangkat kasir. Bidang
 * barcode, nama pengguna, dan kode pegawai malah tidak di-escape sama sekali.
 *
 * Keduanya SUDAH ADA sebelum refactor ini dan sengaja tidak diubah di sini
 * supaya perilakunya tetap sama, tapi keduanya perlu ditutup.
 */
export class MigrationController {
  private userRepository: UserRepository;
  private itemRepository: ItemRepository;
  private migrationRepository: MigrationRepository;

  constructor(
    userRepository: UserRepository,
    itemRepository: ItemRepository,
    migrationRepository: MigrationRepository
  ) {
    this.userRepository = userRepository;
    this.itemRepository = itemRepository;
    this.migrationRepository = migrationRepository;
  }

  sync = async (req: Request, res: Response) => {
    const lastVersion = req.body.last_migration_version;

    if (lastVersion == 0) {
      return this.syncInitial(res);
    }

    return this.syncSince(res, lastVersion);
  };

  /** Perangkat yang belum pernah sinkron sama sekali: kirim seluruh isinya. */
  private syncInitial = async (res: Response) => {
    try {
      const [users, products, migrationVersion] = await Promise.all([
        this.userRepository.fetchActive(),
        this.itemRepository.fetchInitial(),
        this.migrationRepository.fetchLatestVersion(),
      ]);

      const commands: string[] = [];

      for (const x of products) {
        commands.push(`INSERT INTO product (
              reference,
              description,
              price,
              barcode,
              brand,
              type,
              brandID,
              typeID,
              mongoID
          ) VALUES(
              '${x.reference.replace("'", "''")}',
              '${x.description.replace("'", "''")}',
              ${x.price},
              '${x.barcode}',
              '${
                x.itemBrandID == null
                  ? ""
                  : x.itemBrandID.name.replace("'", "''")
              }',
              '${
                x.itemTypeID == null ? "" : x.itemTypeID.name.replace("'", "''")
              }',
              '${x.itemBrandID == null ? "" : x.itemBrandID._id}',
              '${x.itemTypeID == null ? "" : x.itemTypeID._id}',
              '${x._id}'
          );`);

        for (const image of x.images as string[]) {
          commands.push(
            `INSERT INTO product_image (productID, imageUrl) VALUES ('${x._id}', '${process.env.BASE_URL}${image}');`
          );
        }
      }

      for (const x of users) {
        commands.push(
          `INSERT INTO user (userID, code, name) VALUES ('${x._id!}', '${
            x.code
          }', '${x.name}');`
        );
      }

      return res.status(200).send({
        /*
          -1 berarti antrian migrasi masih kosong. Aplikasi kasir menyimpannya
          apa adanya, dan pada sinkronisasi berikutnya mengirim -1 kembali —
          yang lolos ke cabang syncSince() dan mengambil seluruh antrian.
        */
        migrationVersion:
          migrationVersion == null ? -1 : migrationVersion.migration_version,
        commands: commands,
      });
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching initial data ${error}`,
        tag: "Migration",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /** Perangkat yang sudah pernah sinkron: kirim selisihnya saja. */
  private syncSince = async (res: Response, lastVersion: number) => {
    try {
      const result = await this.migrationRepository.fetchSince(lastVersion);

      if (result.length === 0) {
        return res.status(200).send({
          migrationVersion: lastVersion,
          commands: [],
        });
      }

      /*
        Nomor versi diambil dari baris PERTAMA, bukan yang tertinggi — dan
        query-nya tidak diurutkan. Kalau MongoDB mengembalikan baris dalam
        urutan lain, perangkat menyimpan nomor yang salah dan sebagian migrasi
        bisa terlewat pada sinkronisasi berikutnya. Dipertahankan apa adanya.
      */
      return res.status(200).send({
        migrationVersion: result[0].migration_version,
        commands: result.map((x) => x.command),
      });
    } catch (error) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Error on fetching migration data ${error}`,
        tag: "Migration",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default MigrationController;
