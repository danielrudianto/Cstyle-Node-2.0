import CashierController from "../controllers/cashier.controller";
import { BillRepository } from "../repositories/bill.repository";
import ItemStockController from "../controllers/item-stock.controller";
import ItemController from "../controllers/item.controller";
import MembershipController from "../controllers/membership.controller";
import { ItemRepository } from "../repositories/item.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import { StockRepository } from "../repositories/stock.repository";
import { StoreRepository } from "../repositories/store.repository";
import { conn } from "../utils/database.helper";

/**
 * Perakitan bersama untuk seluruh route kasir.
 *
 * Lima berkas route di bawah folder ini memakai controller yang sama, dan
 * merakitnya masing-masing berarti menulis daftar repository yang sama lima
 * kali — mudah tertinggal saat salah satunya berubah. Jadi perakitannya
 * dikumpulkan di sini.
 *
 * Repository-nya sengaja dipakai bersama: semuanya tanpa keadaan internal,
 * hanya pembungkus sambungan database.
 */
const itemRepository = new ItemRepository(conn);
const stockRepository = new StockRepository(conn);
const storeRepository = new StoreRepository(conn);
const membershipRepository = new MembershipRepository(conn);
const billRepository = new BillRepository(conn);

export const cashierController = new CashierController(
  itemRepository,
  stockRepository,
  storeRepository,
  membershipRepository,
  billRepository
);

export const itemController = new ItemController(
  itemRepository,
  new MigrationRepository(conn),
  stockRepository,
  storeRepository
);

export const itemStockController = new ItemStockController(
  itemRepository,
  stockRepository,
  storeRepository
);

export const membershipController = new MembershipController(
  membershipRepository
);
