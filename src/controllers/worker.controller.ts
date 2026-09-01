import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { StockInInterface } from "../interfaces/stock-in.interface";
import {
  RemoveStockInInterface,
  RemoveStockOutInterface,
  StockOutInterface,
  StockOutTempInterface,
  StockOutTransferInterface,
} from "../interfaces/stock-out.interface";
import {
  CommonUpdateWorkerInterface,
  CommonWorkerInterface,
  UpdateProductImageDataInterface,
} from "../interfaces/worker.interface";
import { AdjustmentRepository } from "../repositories/adjustment.repository";
import { BillRepository } from "../repositories/bill.repository";
import { ItemRepository } from "../repositories/item.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MigrationRepository } from "../repositories/migration.repository";
import { UserRepository } from "../repositories/user.repository";
import { StockService } from "../services/stock.service";
import { redisClient } from "../app";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Penerjemah job antrian menjadi pemanggilan service dan repository.
 *
 * Berkas ini dulunya berisi seluruh mesin persediaan — 600 baris logika FIFO
 * di dalam sebuah "controller" yang tidak pernah menyentuh HTTP. Logika itu
 * sekarang tinggal di services/stock.service.ts, dan yang tersisa di sini
 * hanyalah pemetaan job ke pemanggilnya.
 *
 * SEMUA METODE DI SINI MENGEMBALIKAN PROMISE DAN HARUS DITUNGGU.
 *
 * Kode lama memanggil sebagian metodenya tanpa await, dan melempar galat dari
 * dalam .catch() sebuah promise yang tidak dipegang siapa pun. Dua-duanya
 * berakibat sama: BullMQ menandai job sebagai berhasil padahal pekerjaannya
 * gagal, dan lemparannya berakhir sebagai unhandled rejection yang mematikan
 * proses pekerja. Sekarang setiap metode mengembalikan promise-nya, dan
 * worker.ts menunggu semuanya.
 */
export class WorkerController {
  private itemRepository: ItemRepository;
  private userRepository: UserRepository;
  private migrationRepository: MigrationRepository;
  private membershipRepository: MembershipRepository;
  private billRepository: BillRepository;
  private adjustmentRepository: AdjustmentRepository;
  private stockService: StockService;

  constructor(
    itemRepository: ItemRepository,
    userRepository: UserRepository,
    migrationRepository: MigrationRepository,
    membershipRepository: MembershipRepository,
    billRepository: BillRepository,
    adjustmentRepository: AdjustmentRepository,
    stockService: StockService
  ) {
    this.itemRepository = itemRepository;
    this.userRepository = userRepository;
    this.migrationRepository = migrationRepository;
    this.membershipRepository = membershipRepository;
    this.billRepository = billRepository;
    this.adjustmentRepository = adjustmentRepository;
    this.stockService = stockService;
  }

  /* ------------------------------ produk ------------------------------ */

  /**
   * Menyalin produk yang baru dibuat ke antrian migrasi kasir.
   *
   * Merek dan jenis bisa datang sebagai teks id atau sebagai dokumen yang
   * sudah di-populate, tergantung query pemanggilnya — karena itu keduanya
   * diperiksa dulu bentuknya.
   */
  createProduct = async (data: CommonWorkerInterface) => {
    const result = await this.itemRepository.fetchByID(data.id);
    if (!result) {
      new LoggerHelper({
        type: LoggerType.error,
        message: `Unable to find item with id ${data.id}`,
        tag: "Worker",
      }).log();

      throw Error(ErrorList["ITEM_NOT_FOUND"]);
    }

    await this.migrationRepository.createProduct({
      reference: result.reference,
      description: result.description,
      barcode: result.barcode == undefined ? null : result.barcode,
      brand:
        typeof result.itemBrandID != "string"
          ? (result.itemBrandID as any).name
          : "",
      type:
        typeof result.itemTypeID != "string"
          ? (result.itemTypeID as any).name
          : "",
      brandID:
        typeof result.itemBrandID == "string"
          ? result.itemBrandID
          : (result.itemBrandID as any)._id,
      typeID:
        typeof result.itemTypeID == "string"
          ? result.itemTypeID
          : (result.itemTypeID as any)._id,
      price: result.price,
      id: result._id.toString(),
      isActive: result.isActive,
      images: result.images,
    });
  };

  updateProduct = async (data: CommonWorkerInterface) => {
    const result = await this.itemRepository.fetchByID(data.id);
    if (!result) {
      throw new Error("Product not found");
    }

    /* images sengaja dikirim kosong: perubahan gambar punya job sendiri. */
    await this.migrationRepository.updateProduct({
      reference: result.reference,
      description: result.description,
      barcode: result.barcode == undefined ? null : result.barcode,
      brand:
        typeof result.itemBrandID != "string"
          ? (result.itemBrandID as any).name
          : "",
      type:
        typeof result.itemTypeID != "string"
          ? (result.itemTypeID as any).name
          : "",
      brandID:
        typeof result.itemBrandID == "string"
          ? result.itemBrandID
          : (result.itemBrandID as any)._id,
      typeID:
        typeof result.itemTypeID == "string"
          ? result.itemTypeID
          : (result.itemTypeID as any)._id,
      price: result.price,
      id: result._id.toString(),
      isActive: result.isActive,
      images: [],
    });
  };

  updateProductType = (data: CommonUpdateWorkerInterface) =>
    this.migrationRepository.updateProductType({
      id: data.id,
      name: data.name,
    });

  updateProductBrand = (data: CommonUpdateWorkerInterface) =>
    this.migrationRepository.updateProductBrand({
      id: data.id,
      name: data.name,
    });

  updateProductImages = (data: UpdateProductImageDataInterface) =>
    this.migrationRepository.updateProductImages({
      id: data.id,
      images: data.images as string[],
    });

  deleteProduct = async (data: CommonWorkerInterface) => {
    const item = await this.itemRepository.fetchByID(data.id);
    if (!item) {
      throw Error(ErrorList["ITEM_NOT_FOUND"]);
    }

    await this.migrationRepository.deleteProduct(data.id);

    /* Ditunggu satu per satu; kode lama memakai forEach dengan callback async. */
    for (const image of item.images as string[]) {
      await this.migrationRepository.deleteProductImage(image, data.id);
    }
  };

  /* ----------------------------- pengguna ----------------------------- */

  createUser = async (data: CommonWorkerInterface) => {
    const user = await this.userRepository.fetchByID(data.id);
    await this.migrationRepository.createUser({
      name: user.name,
      userID: user._id!.toString(),
      code: user.code,
    });
  };

  updateUser = async (data: CommonWorkerInterface) => {
    const user = await this.userRepository.fetchByID(data.id);
    await this.migrationRepository.updateUser({
      name: user.name,
      userID: user._id!.toString(),
      code: user.code,
    });
  };

  deleteUser = (data: CommonWorkerInterface) =>
    this.migrationRepository.deleteUser(data.id);

  /* ------------------------------- nota ------------------------------- */

  /**
   * Menyelesaikan nota yang baru masuk: poin anggota dan pengurangan stok.
   *
   * Nilai belanja dihitung ulang dari barisnya, bukan diambil dari total yang
   * dikirim perangkat kasir.
   */
  createBill = async (data: CommonWorkerInterface) => {
    const result = await this.billRepository.fetchByID(data.id);
    if (!result) {
      throw Error(ErrorList["BILL_NOT_FOUND"]);
    }

    const value = result.items.reduce(
      (acc: number, item: any) =>
        acc + (item.price - item.discount) * item.quantity,
      0
    );

    if (result.memberID != null) {
      /*
        Kurs poin disimpan di Redis dengan kunci "conversion". Kalau kuncinya
        belum ada, Number(null) menghasilkan 0 dan anggota TIDAK mendapat poin
        sama sekali — diam-diam, tanpa galat. Perilaku lama dipertahankan.
      */
      const conversion = await redisClient.get("conversion");
      const point =
        Number(conversion) == 0 ? 0 : Math.floor(value / Number(conversion));

      await this.membershipRepository.updatePoint(result.memberID, point);
    }

    /* Ditunggu satu per satu; kode lama memakai forEach dengan callback async. */
    for (const x of result.items as any[]) {
      await queue.add("insertStockOut", {
        date: result.date,
        itemID: x.itemID._id,
        quantity: x.quantity,
        adjustmentEventID: null,
        storeID: result.storeID,
        billID: result._id.toString(),
        invoiceID: null,
      } as StockOutInterface);
    }
  };

  /* ---------------------------- penyesuaian ---------------------------- */

  /**
   * Membatalkan penyesuaian stok.
   *
   * Baris bernilai positif dulunya menambah stok, jadi pembatalannya menghapus
   * stock-in. Baris negatif sebaliknya.
   */
  deleteAdjustment = async (data: CommonWorkerInterface) => {
    const adjustmentEvent = await this.adjustmentRepository.fetchByID(data.id);
    if (!adjustmentEvent || !adjustmentEvent.isDelete) {
      throw Error(ErrorList["ADJUSTMENT_EVENT_NOT_FOUND"]);
    }

    const storeID =
      adjustmentEvent.storeID == null ? null : adjustmentEvent.storeID._id;

    for (const x of adjustmentEvent.items as any[]) {
      if (x.quantity > 0) {
        await queue.add("removeStockIn", {
          itemID: x.itemID._id,
          quantity: x.quantity,
          storeID: storeID,
          goodReceiptID: null,
          adjustmentCaseID: data.id,
        } as RemoveStockInInterface);
      } else if (x.quantity < 0) {
        await queue.add("removeStockOut", {
          itemID: x.itemID,
          quantity: x.quantity,
          storeID: storeID,
          billID: null,
          invoiceID: null,
          adjustmentCaseID: data.id,
        } as RemoveStockOutInterface);
      }
    }

    /*
      Satu kali setelah seluruh baris diproses. Kode lama memanggilnya di
      DALAM perulangan, sehingga satu penyesuaian dengan 50 baris memicu 50
      job checkOverflow yang mengerjakan hal yang sama.
    */
    await queue.add("checkOverflow", {});
  };

  /* ----------------------------- persediaan ----------------------------- */

  insertStockIn = (data: StockInInterface) =>
    this.stockService.insertStockIn(data);

  insertStockOut = (data: StockOutInterface) =>
    this.stockService.insertStockOut(data);

  insertStockOutOnly = (data: StockOutInterface) =>
    this.stockService.insertStockOutOnly(data);

  removeStockIn = (data: RemoveStockInInterface) =>
    this.stockService.removeStockIn(data);

  removeStockOut = (data: RemoveStockOutInterface) =>
    this.stockService.removeStockOut(data);

  insertStockOutCardOnly = (data: StockOutTempInterface) =>
    this.stockService.insertStockOutCardOnly(data);

  removeStockOutCardOnly = (data: StockOutTempInterface) =>
    this.stockService.removeStockOutCardOnly(data);

  stockOutTransfer = (data: StockOutTransferInterface) =>
    this.stockService.stockOutTransfer(data);

  stockInTransfer = (data: StockOutTransferInterface) =>
    this.stockService.stockInTransfer(data);

  checkOverflow = () => this.stockService.checkOverflow();
}

export default WorkerController;
