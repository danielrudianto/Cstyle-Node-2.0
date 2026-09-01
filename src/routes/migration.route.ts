import { Router } from "express";
import MigrationController from "../controllers/migration.controller";
import { ItemRepository } from "../repositories/item.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import { UserRepository } from "../repositories/user.repository";
import { conn } from "../utils/database.helper";

const router = Router();

const migrationController = new MigrationController(
  new UserRepository(conn),
  new ItemRepository(conn),
  new MigrationRepository(conn)
);

/*
  TANPA AUTENTIKASI — sama seperti sebelumnya.

  Endpoint ini mengembalikan seluruh katalog produk dan daftar pengguna
  (nama, kode pegawai, id) kepada siapa pun yang mengirim
  last_migration_version = 0. Lihat catatan lengkapnya di
  controllers/migration.controller.ts.
*/
router.post("/", migrationController.sync);

export default router;
