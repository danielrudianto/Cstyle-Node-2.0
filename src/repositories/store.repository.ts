import { Connection } from "mongoose";
import { ErrorList } from "../constants/error-list.constant";
import { IFetch } from "../interfaces/fetch.interface";
import { IStore, IStoreUpdateCheck } from "../interfaces/store.interface";
import { StoreModel } from "../models/store.model";

/**
 * Semua akses database untuk toko.
 *
 * Query dipindahkan APA ADANYA dari models/store.model.ts. Cacat yang
 * diketahui dan sengaja dipertahankan:
 *
 *   - fetch() tidak menyaring `isActive`, sehingga daftar toko ikut memuat
 *     toko yang sudah dinonaktifkan — berbeda dari fetchOthers() dan
 *     fetchAutocomplete() yang menyaringnya.
 *   - fetchByCode() MELEMPAR galat kalau toko tidak ditemukan, bukan
 *     mengembalikan null. Pemanggilnya mengandalkan itu.
 *   - Kata kunci pencarian dirangkai menjadi RegExp tanpa escape.
 */
export class StoreRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("stores");
  }

  async create(data: IStore): Promise<StoreModel> {
    try {
      const result = await this.collection.create({
        name: data.name,
        prefix: data.prefix,
        address: data.address,
        phoneNumber: data.phoneNumber,
        code: data.code,
        createdBy: data.createdBy,
        createdAt: new Date(),
      });

      return StoreModel.fromMap(result);
    } catch (error) {
      console.error(`[error]: Error on creating store: ${error}`);
      throw error;
    }
  }

  /** Mengembalikan dokumen SEBELUM perubahan, sama seperti sebelumnya. */
  async update(data: IStore): Promise<StoreModel | null> {
    try {
      const result = await this.collection.findByIdAndUpdate(data._id, {
        name: data.name,
        prefix: data.prefix,
        address: data.address,
        phoneNumber: data.phoneNumber,
        code: data.code,
      });

      return result ? StoreModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on updating store: ${error}`);
      throw error;
    }
  }

  /** Daftar berhalaman — tidak menyaring isActive, lihat catatan di atas. */
  async fetch(data: IFetch): Promise<{ data: StoreModel[]; count: number }> {
    try {
      const filter = {
        $or: [
          { name: { $regex: new RegExp(data.keyword, "i") } },
          { prefix: { $regex: new RegExp(data.keyword, "i") } },
          { phoneNumber: { $regex: new RegExp(data.keyword, "i") } },
          { address: { $regex: new RegExp(data.keyword, "i") } },
        ],
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(filter)
          .skip((data.page - 1) * 20)
          .limit(20)
          .sort({ name: 1 }),
        this.collection.countDocuments(filter),
      ]);

      return {
        data: rows.map((row) => StoreModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching store: ${error}`);
      throw error;
    }
  }

  /**
   * Toko aktif selain yang sedang dipakai pemanggil.
   *
   * Kalau storeID null, seluruh toko aktif dikembalikan. Hanya `name` dan
   * `address` yang diambil, jadi hasilnya dikembalikan mentah — memetakannya
   * ke StoreModel akan memunculkan bidang kosong yang sebelumnya tidak ada di
   * balasan.
   */
  fetchOthers(storeID: string | null) {
    const filter =
      storeID == null
        ? { isActive: true }
        : { _id: { $ne: storeID }, isActive: true };

    return this.collection.find(filter).select("name address").sort({ name: 1 });
  }

  /** MELEMPAR galat kalau tidak ditemukan — lihat catatan di atas. */
  async fetchByCode(code: string): Promise<StoreModel> {
    const store = await this.collection.find({ code: code, isActive: true });
    if (store.length === 0) {
      throw Error(ErrorList["STORE_NOT_FOUND"]);
    }

    return StoreModel.fromMap(store[0]);
  }

  /** Dipakai auth.interceptor untuk mengenali toko dari header. */
  async fetchActiveByCode(code: string): Promise<StoreModel | null> {
    const store = await this.collection.findOne({
      code: code,
      isActive: true,
    });

    return store ? StoreModel.fromMap(store) : null;
  }

  async fetchAutocomplete(keyword: string): Promise<StoreModel[]> {
    const rows = await this.collection.find({
      name: { $regex: new RegExp(keyword, "i") },
      isActive: true,
    });

    return rows.map((row) => StoreModel.fromMap(row));
  }

  async fetchByID(id: string): Promise<StoreModel | null> {
    const result = await this.collection.findById(id);
    return result ? StoreModel.fromMap(result) : null;
  }

  /** Penonaktifan, bukan penghapusan sungguhan. */
  async delete(id: string, userID: string): Promise<StoreModel | null> {
    const result = await this.collection.findByIdAndUpdate(id, {
      isActive: false,
      deletedBy: userID,
      deletedAt: new Date(),
    });

    return result ? StoreModel.fromMap(result) : null;
  }

  /** Nama, prefix, ATAU kode sudah dipakai toko lain. */
  async isTaken(data: IStore): Promise<boolean> {
    const count = await this.collection.countDocuments({
      $or: [{ name: data.name }, { prefix: data.prefix }, { code: data.code }],
    });

    return count !== 0;
  }

  /**
   * Sama seperti isTaken(), tapi mengabaikan toko yang sedang disunting dan
   * TIDAK memeriksa kode — mengikuti kode lama.
   */
  async isTakenByOther(data: IStoreUpdateCheck): Promise<boolean> {
    const count = await this.collection.countDocuments({
      $or: [{ name: data.name }, { prefix: data.prefix }],
      _id: { $ne: data.id },
    });

    return count !== 0;
  }
}

export default StoreRepository;
