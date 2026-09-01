import { Connection } from "mongoose";
import { IFetch } from "../interfaces/fetch.interface";
import { IItemType } from "../interfaces/item-type.interface";
import { ItemTypeModel } from "../models/item-type.model";

/**
 * Semua akses database untuk jenis barang.
 *
 * Bentuknya hampir kembar dengan item-brand.repository.ts, termasuk dua cacat
 * yang sama dan sengaja dipertahankan:
 *
 *   - isNameTaken() menyaring dengan `is_delete`, padahal koleksinya memakai
 *     `isDelete`, sehingga pemeriksaan nama ganda saat pembuatan tidak pernah
 *     berjalan. Perhatikan bahwa isNameTakenByOther() — yang dipakai saat
 *     penyuntingan — memakai nama bidang yang BENAR, jadi keduanya berperilaku
 *     berbeda meski terlihat serupa.
 *
 *   - fetchAutocomplete() memberikan `{ limit: 5 }` sebagai proyeksi, bukan
 *     opsi, sehingga hasilnya tidak dibatasi dan setiap baris hanya membawa
 *     `_id`.
 */
export class ItemTypeRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("itemtypes");
  }

  async create(data: IItemType): Promise<ItemTypeModel> {
    try {
      const result = await this.collection.create({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        createdAt: new Date(),
      });

      return ItemTypeModel.fromMap(result);
    } catch (error) {
      console.error(`[error]: Error on creating item type: ${error}`);
      throw error;
    }
  }

  /** Hanya nama yang diperbarui — deskripsi sengaja tidak ikut, seperti sebelumnya. */
  async update(data: IItemType) {
    try {
      return await this.collection.updateOne(
        { _id: data._id },
        { name: data.name }
      );
    } catch (error) {
      console.error(`[error]: Error on updating item type: ${error}`);
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
      console.error(`[error]: Error on deleting item type: ${error}`);
      throw error;
    }
  }

  async fetchByID(id: string): Promise<ItemTypeModel | null> {
    try {
      const result = await this.collection.findById(id);
      return result ? ItemTypeModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on fetching item type by id: ${error}`);
      throw error;
    }
  }

  /** Daftar berhalaman beserta jumlah totalnya; mencari di nama dan deskripsi. */
  async fetch(data: IFetch): Promise<{ data: ItemTypeModel[]; count: number }> {
    try {
      const filter = {
        isDelete: false,
        $or: [
          { name: { $regex: new RegExp(data.keyword, "i") } },
          { description: { $regex: new RegExp(data.keyword, "i") } },
        ],
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
        data: rows.map((row) => ItemTypeModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching item type: ${error}`);
      throw error;
    }
  }

  /**
   * Autocomplete — bentuk pemanggilan find() dipertahankan persis, termasuk
   * `{ limit: 5 }` yang sebenarnya proyeksi. Lihat catatan di atas.
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
        `[error]: Error on fetching item type autocomplete: ${error}`
      );
      throw error;
    }
  }

  async count(): Promise<number> {
    return this.collection.countDocuments({ isDelete: false });
  }

  /** Penyaringnya salah nama bidang, jadi hasilnya selalu false — lihat catatan. */
  async isNameTaken(name?: string): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments({
        name: name,
        is_delete: false,
      });

      return count !== 0;
    } catch (error) {
      console.error(`[error]: Error on checking item type name: ${error}`);
      throw error;
    }
  }

  /**
   * Nama sudah dipakai jenis lain, atau jenis yang disunting tidak ada.
   *
   * Dua pemeriksaan ini digabung persis seperti di kode lama, sehingga
   * pemanggil tidak bisa membedakan keduanya.
   */
  async isNameTakenByOtherOrMissing(data: IItemType): Promise<boolean> {
    try {
      const [count, exists] = await Promise.all([
        this.collection.countDocuments({
          name: data.name,
          isDelete: false,
          _id: { $ne: data._id },
        }),
        this.collection.findById(data._id),
      ]);

      return !(count === 0 && exists != null);
    } catch (error) {
      console.error(`[error]: Error on checking item type: ${error}`);
      throw error;
    }
  }

  /** Ada dan belum dihapus. */
  async existsActive(id?: string): Promise<boolean> {
    try {
      const result = await this.collection.findById(id);
      return result == null ? false : !result.isDelete;
    } catch (error) {
      console.error(`[error]: Error on checking item type: ${error}`);
      throw error;
    }
  }
}

export default ItemTypeRepository;
