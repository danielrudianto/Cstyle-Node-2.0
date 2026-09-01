import { Connection } from "mongoose";
import { ICheckStock, IStock } from "../interfaces/stock.interface";
import { StockModel } from "../models/stock.model";

/**
 * Semua akses database untuk stok.
 *
 * Koleksi `stocks` menyimpan jumlah berjalan per barang per toko. Isinya
 * diubah dengan $inc, bukan ditulis ulang, supaya dua penambahan yang terjadi
 * bersamaan tidak saling menimpa.
 *
 * CATATAN: `storeID` bernilai null adalah nilai yang SAH dan punya arti —
 * yaitu stok gudang pusat, bukan stok toko. Query di bawah menyaring dengan
 * `storeID: null` secara sengaja, jadi jangan diganti menjadi $exists atau
 * dihilangkan.
 */
export class StockRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("stocks");
  }

  /**
   * Menambah atau mengurangi stok satu barang pada satu toko.
   *
   * `upsert` membuat barisnya kalau belum ada, sehingga barang yang belum
   * pernah punya stok tidak perlu disiapkan lebih dulu.
   */
  async increment(data: IStock): Promise<void> {
    try {
      await this.collection.findOneAndUpdate(
        {
          storeID: data.storeID,
          itemID: data.itemID,
        },
        {
          $inc: { quantity: data.quantity },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    } catch (error) {
      console.error(`[error]: Error on updating stock: ${error}`);
      throw error;
    }
  }

  async fetchByItemIDs(
    items: ICheckStock[],
    storeID: string | null
  ): Promise<StockModel[]> {
    const rows = await this.collection.find({
      itemID: { $in: items.map((x) => x.itemID) },
      storeID: storeID,
    });

    return rows.map((row) => StockModel.fromMap(row));
  }

  /**
   * Jumlah stok di toko yang diminta, dan jumlah di seluruh toko lain.
   *
   * Dikembalikan sebagai dua larik hasil agregasi, bukan model, karena
   * bentuknya memang bukan baris stok melainkan hasil pengelompokan.
   */
  fetchDashboardByItemIDs(items: ICheckStock[], storeID: string | null) {
    const group = {
      $group: {
        _id: "$itemID",
        quantity: { $sum: "$quantity" },
      },
    };

    return Promise.all([
      this.collection.aggregate([
        {
          $match: {
            itemID: { $in: items.map((x) => x.itemID) },
            storeID: storeID,
          },
        },
        group,
      ]),
      this.collection.aggregate([
        {
          $match: {
            itemID: { $in: items.map((x) => x.itemID) },
            storeID: { $ne: storeID },
          },
        },
        group,
      ]),
    ]);
  }

  /** Stok per toko untuk sekumpulan barang, dipakai aplikasi kasir. */
  fetchGroupedByStore(itemIDs: string[]) {
    return this.collection.aggregate([
      { $match: { itemID: { $in: itemIDs } } },
      {
        $group: {
          _id: { storeID: "$storeID", itemID: "$itemID" },
          quantity: { $sum: "$quantity" },
        },
      },
    ]);
  }

  /** Hanya baris yang jumlahnya di atas nol. */
  async fetchByStoreID(storeID: string): Promise<StockModel[]> {
    const rows = await this.collection.find({
      storeID: storeID,
      quantity: { $gt: 0 },
    });

    return rows.map((row) => StockModel.fromMap(row));
  }

  /** Satu barang di seluruh toko, beserta nama dan alamat tokonya. */
  fetchByItemID(itemID: string) {
    return this.collection
      .find({ itemID: itemID })
      .populate("storeID", "name address");
  }

  /** Seluruh baris stok, tanpa batas jumlah. */
  fetchInitial() {
    return this.collection.find({});
  }
}

export default StockRepository;
