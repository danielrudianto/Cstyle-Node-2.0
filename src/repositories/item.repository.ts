import { Connection, Types } from "mongoose";
import {
  IItem,
  IItemDelete,
  IItemFetch,
  IItemFetchBranch,
  IItemPriceFetch,
  IItemUpdateFavorite,
  IItemUpdatePrice,
} from "../interfaces/item.interface";
import { ItemModel } from "../models/item.model";

/**
 * Semua akses database untuk barang.
 *
 * Query dipindahkan APA ADANYA dari models/item.model.ts. Cacat yang
 * diketahui dan SENGAJA dipertahankan supaya balasan API tidak berubah:
 *
 *   1. fetch() memakai .select() pada cabang onlyActive, tapi .populate()
 *      pada cabang sebaliknya — padahal daftar bidang yang diberikan bukan
 *      referensi ke koleksi lain. Akibatnya kedua cabang mengembalikan bentuk
 *      dokumen yang BERBEDA: yang satu terpangkas, yang satu utuh.
 *
 *   2. Kata kunci pencarian dirangkai langsung menjadi RegExp tanpa escape,
 *      jadi karakter khusus mengubah arti query. Pola seperti "(a+)+" membuat
 *      MongoDB menelusuri balik tanpa henti.
 *
 *   3. fetchPrices() menyusun `$and: [...filters]`. Kalau pemanggil tidak
 *      mengirim merek maupun jenis, larik itu kosong dan MongoDB menolak
 *      query dengan galat "$and must be a nonempty array".
 *
 *   4. isReferenced() menghitung dokumen di koleksi `items` yang punya bidang
 *      `itemID` — bidang yang tidak ada di sana. Hitungannya selalu nol, jadi
 *      pemeriksaan sebelum penghapusan tidak pernah benar-benar menahan apa
 *      pun. Kemungkinan besar yang dimaksud adalah koleksi stok atau nota.
 *
 *   5. isReferenceTaken() saat penyuntingan tidak menyaring `isDelete`, jadi
 *      barang yang sudah dihapus tetap memblokir pemakaian ulang referensinya.
 *
 *   6. fetchPopular() mundur 30 x 270 hari — sekitar 22 tahun — sehingga
 *      "populer" praktis berarti sepanjang sejarah data.
 */
export class ItemRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("items");
  }

  /** Penyaring pencarian, dipakai bersama oleh daftar dan penghitungnya. */
  private searchFilter(keyword: string, onlyActive: boolean) {
    const filter: any = {
      isDelete: false,
      $or: [
        { reference: { $regex: RegExp(keyword, "i") } },
        { description: { $regex: RegExp(keyword, "i") } },
      ],
    };

    if (onlyActive) {
      filter.isActive = true;
    }

    return filter;
  }

  create(data: IItem) {
    return this.collection.create({
      reference: data.reference,
      description: data.description,
      barcode: data.barcode,
      itemTypeID: data.itemTypeID,
      itemBrandID: data.itemBrandID,
      createdBy: data.createdBy,
      price: data.price,
      isFavorite: data.isFavorite,
      createdAt: new Date(),
      images: data.images,
    });
  }

  update(data: IItem) {
    return this.collection.updateOne(
      { _id: data._id },
      {
        reference: data.reference,
        description: data.description,
        barcode: data.barcode,
        itemTypeID: data.itemTypeID,
        itemBrandID: data.itemBrandID,
        price: data.price,
        images: data.images,
        isActive: data.isActive,
      }
    );
  }

  /**
   * Daftar barang berhalaman.
   *
   * Bentuk dokumen yang dikembalikan berbeda antara kedua cabang — lihat
   * catatan nomor 1 di atas. Karena itu hasilnya dikembalikan mentah dan
   * tidak dipetakan ke ItemModel: memetakannya akan menyeragamkan bentuknya
   * dan justru mengubah balasan API.
   */
  async fetch(data: IItemFetch): Promise<{ data: any[]; count: number }> {
    try {
      const filter = this.searchFilter(data.keyword, data.onlyActive);

      const query = data.onlyActive
        ? this.collection
            .find(filter)
            .skip((data.page - 1) * 20)
            .limit(20)
            .populate({ path: "itemBrandID", select: "name" })
            .select("_id reference description createdAt images price")
            .populate({ path: "itemTypeID", select: "name description" })
            .sort({ reference: 1 })
        : this.collection
            .find(filter)
            .skip((data.page - 1) * 20)
            .limit(20)
            .populate({ path: "itemBrandID", select: "name" })
            .populate("_id reference description createdAt images price")
            .populate({ path: "itemTypeID", select: "name description" })
            .sort({ reference: 1 });

      const [rows, count] = await Promise.all([
        query,
        this.collection.countDocuments(filter),
      ]);

      return { data: rows, count: count };
    } catch (error) {
      console.error(`[error]: Error on fetching item: ${error}`);
      throw error;
    }
  }

  /**
   * Daftar barang beserta stok pada satu cabang.
   *
   * Stok diambil dalam satu query untuk seluruh halaman, lalu dipasangkan di
   * memori — bukan satu query per barang.
   */
  async fetchWithStock(
    data: IItemFetchBranch
  ): Promise<{ data: any[]; count: number }> {
    try {
      const filter = this.searchFilter(data.keyword, data.onlyActive);

      const [items, count] = await Promise.all([
        this.collection
          .find(filter)
          .populate("itemBrandID", "name")
          .populate("itemTypeID", "name")
          .limit(20)
          .skip((data.page - 1) * 20)
          .sort({ reference: 1 }),
        this.collection.countDocuments(filter),
      ]);

      const stocks = await this.conn.model("stocks").find({
        itemID: { $in: items.map((item) => item._id) },
        storeID: data.branch,
      });

      const stockByItem = new Map<string, number>();
      for (const stock of stocks) {
        stockByItem.set(stock.itemID.toString(), stock.quantity);
      }

      return {
        data: items.map((x) => ({
          item: {
            _id: x._id,
            reference: x.reference,
            description: x.description,
            createdAt: x.createdAt,
            price: x.price,
            brand: x.itemBrandID == null ? "" : x.itemBrandID.name,
            type: x.itemTypeID == null ? "" : x.itemTypeID.name,
          },
          quantity: stockByItem.get(x._id.toString()) ?? 0,
        })),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching item with stock: ${error}`);
      throw error;
    }
  }

  /**
   * Daftar harga, disaring merek dan/atau jenis.
   *
   * `$and` dengan larik kosong ditolak MongoDB — lihat catatan nomor 3.
   */
  fetchPrices(data: IItemPriceFetch) {
    const filters = [];

    if (data.brand.length > 0) {
      filters.push({ itemBrandID: { $in: data.brand } });
    }

    if (data.type.length > 0) {
      filters.push({ itemTypeID: { $in: data.type } });
    }

    return this.collection
      .find({ $and: [...filters], isDelete: false })
      .select("_id reference description price")
      .populate("itemTypeID", "name")
      .populate("itemBrandID", "name")
      .sort({ reference: 1 });
  }

  /** Sepuluh barang terlaris dari nota kasir dan dari packing list. */
  fetchPopular() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 30 * 270);

    const pipeline = (collection: string) =>
      this.conn.model(collection).aggregate([
        {
          $match: {
            date: { $gte: new Date(currentDate) },
            isDelete: false,
          },
        },
        { $unwind: { path: "$items" } },
        {
          $group: {
            _id: "$items.itemID",
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "items",
            localField: "_id",
            foreignField: "_id",
            as: "item",
          },
        },
        { $unwind: { path: "$item" } },
        {
          $project: {
            reference: "$item.reference",
            description: "$item.description",
            quantity: "$quantity",
          },
        },
      ]);

    return Promise.all([pipeline("packing-lists"), pipeline("bills")]);
  }

  updatePrice(data: IItemUpdatePrice[]) {
    return this.collection.bulkWrite(
      data.map((x) => ({
        updateOne: {
          filter: { _id: x.id },
          update: { $set: { price: x.price } },
        },
      }))
    );
  }

  updateFavoriteStatus(data: IItemUpdateFavorite) {
    return this.collection.updateOne(
      { _id: data.id },
      { isFavorite: data.isFavorite }
    );
  }

  /** Membuang satu gambar dari daftar gambar barang. */
  async deleteImage(imageURL: string, itemID: string) {
    const item = await this.collection.findById(itemID);
    if (!item) {
      throw new Error("Item not found");
    }

    item.images = item.images?.filter((x: string) => x !== imageURL);
    return item.save();
  }

  /** Penandaan terhapus, bukan penghapusan sungguhan. */
  delete(data: IItemDelete) {
    return this.collection.findByIdAndUpdate(data.id, {
      isDelete: true,
      deletedAt: new Date(),
      deletedBy: data.userID,
    });
  }

  /**
   * Satu barang beserta merek dan jenisnya.
   *
   * MELEMPAR galat kalau id-nya bukan ObjectId yang sah, karena
   * new Types.ObjectId() menolaknya — perilaku lama yang dipertahankan.
   */
  fetchByID(id: string) {
    return this.collection
      .findById(new Types.ObjectId(id))
      .populate("itemTypeID")
      .populate("itemBrandID");
  }

  /** Seluruh barang yang belum dihapus, tanpa batas jumlah. */
  fetchInitial(): Promise<any[]> {
    return this.collection
      .find({ isDelete: false })
      .populate("itemTypeID")
      .populate("itemBrandID") as unknown as Promise<any[]>;
  }

  /** Seluruh barang untuk unduhan, dengan bidang yang dipangkas. */
  download() {
    return this.collection
      .find({ isDelete: false })
      .select("reference description price barcode")
      .populate("itemTypeID", "name")
      .populate("itemBrandID", "name")
      .sort({ reference: 1 });
  }

  count(): Promise<number> {
    return this.collection.countDocuments({ isDelete: false });
  }

  /** Referensi sudah dipakai barang lain yang belum dihapus. */
  async isReferenceTaken(reference?: string): Promise<boolean> {
    const count = await this.collection.countDocuments({
      reference: reference,
      isDelete: false,
    });

    return count !== 0;
  }

  /**
   * Sama seperti isReferenceTaken(), tapi mengabaikan barang yang sedang
   * disunting. Tidak menyaring `isDelete` — lihat catatan nomor 5.
   */
  async isReferenceTakenByOther(
    reference?: string,
    id?: string
  ): Promise<boolean> {
    const count = await this.collection.countDocuments({
      reference: reference,
      _id: { $ne: id },
    });

    return count !== 0;
  }

  /** Penyaringnya salah koleksi, jadi hasilnya selalu false — lihat catatan nomor 4. */
  async isReferenced(id: string): Promise<boolean> {
    const count = await this.collection.countDocuments({
      itemID: id,
      isDelete: false,
    });

    return count !== 0;
  }
}

export default ItemRepository;
