import { Job as BullJob, Worker } from "bullmq";
import WorkerController from "./controllers/worker.controller";
import { LoggerType } from "./interfaces/logger.interface";
import { StockInInterface } from "./interfaces/stock-in.interface";
import {
  RemoveStockInInterface,
  RemoveStockOutInterface,
  StockOutInterface,
  StockOutTempInterface,
  StockOutTransferInterface,
} from "./interfaces/stock-out.interface";
import {
  CommonUpdateWorkerInterface,
  CommonWorkerInterface,
  UpdateProductImageDataInterface,
} from "./interfaces/worker.interface";
import { AdjustmentRepository } from "./repositories/adjustment.repository";
import { BillRepository } from "./repositories/bill.repository";
import { ItemRepository } from "./repositories/item.repository";
import { MembershipRepository } from "./repositories/membership.repository";
import { MigrationRepository } from "./repositories/migration.repository";
import { OverflowRepository } from "./repositories/overflow.repository";
import { StockCardRepository } from "./repositories/stock-card.repository";
import { StockInRepository } from "./repositories/stock-in.repository";
import { StockOutRepository } from "./repositories/stock-out.repository";
import { StockRepository } from "./repositories/stock.repository";
import { UserRepository } from "./repositories/user.repository";
import { StockService } from "./services/stock.service";
import { conn } from "./utils/database.helper";
import LoggerHelper from "./utils/logger.helper";

/**
 * Proses pekerja antrian.
 *
 * CONCURRENCY WAJIB 1.
 *
 * Mesin FIFO membaca sisa stok lalu menuliskannya kembali dalam dua langkah
 * terpisah, tanpa transaksi. Dua job yang berjalan bersamaan untuk barang yang
 * sama akan saling menimpa dan merusak angka harga pokok. Sampai operasinya
 * dibuat atomik, nilai ini tidak boleh dinaikkan.
 *
 * Kode lama menaruh `concurrency` DI DALAM objek `connection`, tempat BullMQ
 * tidak pernah membacanya. Nilainya kebetulan aman karena bawaannya memang 1 —
 * sekarang ditulis di tempat yang benar supaya niatnya terbaca.
 */
const workerOptions = {
  connection: {
    host: "localhost",
    port: 6379,
  },
  concurrency: 1,
};

const stockService = new StockService(
  new StockRepository(conn),
  new StockInRepository(conn),
  new StockOutRepository(conn),
  new StockCardRepository(conn),
  new OverflowRepository(conn)
);

const workerController = new WorkerController(
  new ItemRepository(conn),
  new UserRepository(conn),
  new MigrationRepository(conn),
  new MembershipRepository(conn),
  new BillRepository(conn),
  new AdjustmentRepository(conn),
  stockService
);

interface JobDataMap {
  createProduct: CommonWorkerInterface;
  updateProduct: CommonWorkerInterface;
  updateProductImage: UpdateProductImageDataInterface;
  deleteProduct: CommonWorkerInterface;
  updateProductType: CommonUpdateWorkerInterface;
  updateProductBrand: CommonUpdateWorkerInterface;

  createUser: CommonWorkerInterface;
  updateUser: CommonWorkerInterface;
  deleteUser: CommonWorkerInterface;

  createBill: CommonWorkerInterface;
  deleteAdjustment: CommonWorkerInterface;

  insertStockIn: StockInInterface;
  insertStockOut: StockOutInterface;
  insertStockOutOnly: StockOutInterface;
  insertStockOutTemp: StockOutTempInterface;
  removeStockOutTemp: StockOutTempInterface;
  insertStockOutTransfer: StockOutTransferInterface;
  insertStockInTransfer: StockOutTransferInterface;
  removeStockIn: RemoveStockInInterface;
  removeStockOut: RemoveStockOutInterface;
  checkOverflow: void;
}

type JobName = keyof JobDataMap;

interface Job<T extends JobName> {
  name: T;
  data: JobDataMap[T];
}

/**
 * Peta nama job ke penanganannya.
 *
 * Bentuk peta dipilih menggantikan switch karena switch yang lama punya satu
 * cabang TANPA `break` — "removeStockOut" jatuh ke "checkOverflow", sehingga
 * setiap pembatalan barang keluar diam-diam memicu penyapuan overflow.
 * Dengan peta, kesalahan seperti itu tidak mungkin terjadi.
 *
 * Nama job yang TIDAK ada di sini akan dicatat sebagai galat, bukan diabaikan
 * diam-diam. Dua nama memang sudah lama masuk antrian tanpa penanganan:
 * "createProductImage" dari item.controller dan "update-item-type" dari
 * item-type.controller. Keduanya akan mulai terlihat di log — itu memang
 * tujuannya.
 */
const handlers: {
  [K in JobName]: (data: JobDataMap[K]) => Promise<unknown>;
} = {
  createProduct: (d) => workerController.createProduct(d),
  updateProduct: (d) => workerController.updateProduct(d),
  updateProductImage: (d) => workerController.updateProductImages(d),
  deleteProduct: (d) => workerController.deleteProduct(d),
  updateProductType: (d) => workerController.updateProductType(d),
  updateProductBrand: (d) => workerController.updateProductBrand(d),

  createUser: (d) => workerController.createUser(d),
  updateUser: (d) => workerController.updateUser(d),
  deleteUser: (d) => workerController.deleteUser(d),

  createBill: (d) => workerController.createBill(d),
  deleteAdjustment: (d) => workerController.deleteAdjustment(d),

  insertStockIn: (d) => workerController.insertStockIn(d),
  insertStockOut: (d) => workerController.insertStockOut(d),
  insertStockOutOnly: (d) => workerController.insertStockOutOnly(d),
  insertStockOutTemp: (d) => workerController.insertStockOutCardOnly(d),
  removeStockOutTemp: (d) => workerController.removeStockOutCardOnly(d),
  insertStockOutTransfer: (d) => workerController.stockOutTransfer(d),
  insertStockInTransfer: (d) => workerController.stockInTransfer(d),
  removeStockIn: (d) => workerController.removeStockIn(d),
  removeStockOut: (d) => workerController.removeStockOut(d),
  checkOverflow: () => workerController.checkOverflow(),
};

/**
 * Setiap penanganan DITUNGGU sampai selesai.
 *
 * Kode lama memanggil sebagian penanganannya tanpa await, sehingga BullMQ
 * menandai job berhasil sebelum pekerjaannya benar-benar terjadi — dan
 * kegagalannya tidak pernah terlihat.
 */
const workerHandler = async <T extends JobName>(job: Job<T>) => {
  const handler = handlers[job.name];

  if (!handler) {
    new LoggerHelper({
      type: LoggerType.error,
      message: `No handler registered for job "${job.name}"`,
      tag: "Master worker",
    }).log();
    return;
  }

  return handler(job.data);
};

const worker = new Worker("queue", workerHandler as any, workerOptions);

worker.on("failed", (job: BullJob | undefined, err: Error) => {
  new LoggerHelper({
    type: LoggerType.error,
    message: `Job ${job?.id} [${job?.name}] has failed with ${err.message}`,
    tag: "Master worker",
  }).log();
});

worker.on("completed", (job: BullJob) => {
  new LoggerHelper({
    type: LoggerType.info,
    message: `Job ${job.id} [${job.name}] completed at ${new Date().toString()}`,
    tag: "Master worker",
  }).log();
});

worker.on("error", (err: Error) => {
  new LoggerHelper({
    type: LoggerType.error,
    message: `Error on completing job: ${err}`,
    tag: "Master worker",
  }).log();
});
