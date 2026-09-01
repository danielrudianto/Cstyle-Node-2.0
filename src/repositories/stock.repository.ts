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

  /**
   * Menambah atau mengurangi stok BANYAK barang sekaligus, dalam satu
   * perjalanan ke database.
   *
   * KENAPA INI ADA.
   *
   * increment() di atas dipanggil dari dalam perulangan di sebelas tempat —
   * sinkronisasi kasir, faktur, penyesuaian, penerimaan barang, permintaan
   * transfer. Satu kelompok sinkronisasi berisi dua puluh nota dengan sepuluh
   * barang menjalankan dua ratus findOneAndUpdate BERURUTAN, masing-masing
   * menunggu jawaban sebelum yang berikutnya dikirim.
   *
   * Yang mahal bukan pekerjaannya, melainkan perjalanannya: dua ratus kali
   * pulang-pergi ke MongoDB untuk pekerjaan yang muat dalam satu perintah.
   *
   * Ini juga penting untuk penguncian. Seluruh badan sinkronisasi berjalan di
   * dalam kunci per toko, jadi lamanya perjalanan itu adalah lamanya toko lain
   * yang sedang mengantre harus menunggu.
   *
   * BARIS KEMBAR DIGABUNG LEBIH DULU.
   *
   * Satu kelompok nota lazim menyentuh barang yang sama berkali-kali. Kalau
   * dikirim apa adanya, bulkWrite memuat beberapa upsert dengan penyaring yang
   * sama persis, dan pada baris yang belum ada keduanya berlomba membuatnya —
   * menghasilkan galat kunci ganda, atau lebih buruk, dua baris stok untuk
   * barang yang sama. Menjumlahkannya lebih dulu menghilangkan keduanya
   * sekaligus mengurangi jumlah perintah.
   */
  async incrementMany(data: IStock[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    /*
      storeID bernilai null itu SAH — artinya gudang pusat. Dipakai apa adanya
      sebagai bagian kunci penggabungan, dan String(null) menghasilkan "null"
      yang tidak mungkin bentrok dengan ObjectId mana pun.
    */
    const gabungan = new Map<string, IStock>();
    for (const baris of data) {
      const kunci = `${String(baris.itemID)}|${String(baris.storeID)}`;
      const ada = gabungan.get(kunci);

      if (ada) {
        ada.quantity += baris.quantity;
      } else {
        gabungan.set(kunci, { ...baris });
      }
    }

    const perintah = [...gabungan.values()].map((baris) => ({
      updateOne: {
        filter: { storeID: baris.storeID, itemID: baris.itemID },
        update: { $inc: { quantity: baris.quantity } },
        upsert: true,
      },
    }));

    try {
      /*
        ordered: false membolehkan MongoDB mengerjakannya berbarengan. Aman di
        sini karena penyaring tiap perintah sudah dipastikan unik oleh
        penggabungan di atas — tidak ada dua perintah yang menyentuh baris yang
        sama.
      */
      await this.collection.bulkWrite(perintah, { ordered: false });
    } catch (error) {
      console.error(`[error]: Error on bulk updating stock: ${error}`);
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
