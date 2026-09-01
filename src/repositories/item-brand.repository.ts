import { Connection } from "mongoose";
import { IFetch } from "../interfaces/fetch.interface";
import { IItemBrand } from "../interfaces/item-brand.interface";
import { ItemBrandModel } from "../models/item-brand.model";

/**
 * Semua akses database untuk merek barang.
 *
 * Query dipindahkan APA ADANYA dari models/item-brand.model.ts. Tiga cacat di
 * bawah ini SENGAJA dipertahankan supaya refactor ini tidak mengubah
 * perilaku, dan dicatat di sini supaya tidak hilang:
 *
 *   1. isNameTaken() menyaring dengan `is_delete`, padahal koleksinya memakai
 *      `isDelete`. Bidang bertulis garis bawah itu tidak ada di dokumen mana
 *      pun, jadi hitungannya SELALU nol dan pemeriksaan nama ganda tidak
 *      pernah benar-benar berjalan.
 *
 *   2. fetchAutocomplete() memberikan `{ limit: 5 }` sebagai argumen KEDUA
 *      find(), dan argumen kedua itu adalah proyeksi, bukan opsi. Akibatnya
 *      hasilnya tidak dibatasi 5 baris, dan setiap baris hanya membawa `_id`
 *      karena proyeksinya meminta bidang bernama "limit". Perbaikannya adalah
 *      .limit(5), tapi itu mengubah isi balasan.
 *
 *   3. exists() dipakai untuk dua hal berbeda — memeriksa sebelum sunting dan
 *      sebelum hapus — tapi pemanggilnya membalas dengan pesan
 *      ITEM_BRAND_ALREADY_EXIST pada kasus sunting, padahal yang terjadi
 *      adalah mereknya tidak ditemukan.
 */
export class ItemBrandRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("itembrands");
  }

  async create(data: IItemBrand): Promise<ItemBrandModel> {
    try {
      const result = await this.collection.create({
        name: data.name,
        createdBy: data.createdBy,
        createdAt: new Date(),
      });

      return ItemBrandModel.fromMap(result);
    } catch (error) {
      console.error(`[error]: Error on creating item brand: ${error}`);
      throw error;
    }
  }

  /** Mengembalikan hasil updateOne apa adanya, seperti sebelumnya. */
  async update(data: IItemBrand) {
    try {
      return await this.collection.updateOne(
        { _id: data._id },
        { name: data.name }
      );
    } catch (error) {
      console.error(`[error]: Error on updating item brand: ${error}`);
      throw error;
    }
  }

  async delete(id: string, userID: string) {
    try {
      return await this.collection.updateOne(
        { _id: id },
        {
          isDelete: true,
          deletedAt: new Date(),
          deletedBy: userID,
        }
      );
    } catch (error) {
      console.error(`[error]: Error on deleting item brand: ${error}`);
      throw error;
    }
  }

  async fetchByID(id: string): Promise<ItemBrandModel | null> {
    try {
      const result = await this.collection.findById(id);
      return result ? ItemBrandModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on fetching item brand by id: ${error}`);
      throw error;
    }
  }

  /** Daftar berhalaman beserta jumlah totalnya. */
  async fetch(
    data: IFetch
  ): Promise<{ data: ItemBrandModel[]; count: number }> {
    try {
      const filter = {
        isDelete: false,
        name: { $regex: new RegExp(data.keyword, "i") },
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(filter)
          .sort({ name: 1 })
          .skip((data.page - 1) * 20)
          .limit(20),
        this.collection.countDocuments(filter),
      ]);

      return {
        data: rows.map((row) => ItemBrandModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching item brand: ${error}`);
      throw error;
    }
  }

  /**
   * Autocomplete.
   *
   * Bentuk pemanggilan find() DIPERTAHANKAN persis, termasuk `{ limit: 5 }`
   * yang sebenarnya proyeksi dan bukan opsi — lihat catatan nomor 2 di atas.
   * Karena itu hasilnya dikembalikan mentah, bukan lewat ItemBrandModel:
   * dokumennya memang tidak membawa `name`, jadi memetakannya ke model hanya
   * akan menghasilkan bidang kosong dan menyamarkan cacatnya.
   */
  async fetchAutocomplete(keyword: string): Promise<any[]> {
    try {
      return await this.collection
        .find(
          keyword === ""
            ? { isDelete: false }
            : {
                isDelete: false,
                name: { $regex: new RegExp(keyword, "i") },
              },
          { limit: 5 }
        )
        .sort({ name: 1 });
    } catch (error) {
      console.error(
        `[error]: Error on fetching item brand autocomplete: ${error}`
      );
      throw error;
    }
  }

  async count(): Promise<number> {
    return this.collection.countDocuments({ isDelete: false });
  }

  /**
   * Memeriksa apakah nama sudah dipakai — lihat catatan nomor 1 di atas,
   * penyaringnya salah nama bidang sehingga hasilnya selalu false.
   */
  async isNameTaken(name?: string): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments({
        name: name,
        is_delete: false,
      });

      return count !== 0;
    } catch (error) {
      console.error(`[error]: Error on checking item brand name: ${error}`);
      throw error;
    }
  }

  /** Ada dan belum dihapus. */
  async existsActive(id?: string): Promise<boolean> {
    try {
      const result = await this.collection.findById(id);
      return result == null ? false : !result.isDelete;
    } catch (error) {
      console.error(`[error]: Error on checking item brand: ${error}`);
      throw error;
    }
  }

  /** Ada, terlepas dari sudah dihapus atau belum. */
  async exists(id?: string): Promise<boolean> {
    try {
      const result = await this.collection.findById(id);
      return result != null;
    } catch (error) {
      console.error(`[error]: Error on checking item brand: ${error}`);
      throw error;
    }
  }
}

export default ItemBrandRepository;
