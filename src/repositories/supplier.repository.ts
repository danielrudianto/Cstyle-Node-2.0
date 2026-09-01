import { Connection } from "mongoose";
import { IFetch } from "../interfaces/fetch.interface";
import {
  ISupplier,
  ISupplierNameCheck,
} from "../interfaces/supplier.interface";
import { SupplierModel } from "../models/supplier.model";

/**
 * Semua akses database untuk pemasok.
 *
 * Query dipindahkan apa adanya dari models/supplier.model.ts. Satu cacat yang
 * dipertahankan: kata kunci pencarian dipakai langsung sebagai `$regex` tanpa
 * di-escape, jadi karakter khusus mengubah arti query.
 */
export class SupplierRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("suppliers");
  }

  async create(data: ISupplier): Promise<SupplierModel> {
    try {
      const result = await this.collection.create({
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        npwp: data.npwp,
        email: data.email,
        createdBy: data.createdBy,
        createdAt: new Date(),
      });

      return SupplierModel.fromMap(result);
    } catch (error) {
      console.error(`[error]: Error on creating supplier: ${error}`);
      throw error;
    }
  }

  /** Mengembalikan dokumen SEBELUM perubahan, sama seperti sebelumnya. */
  async update(data: ISupplier): Promise<SupplierModel | null> {
    try {
      const result = await this.collection.findByIdAndUpdate(data._id, {
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        npwp: data.npwp,
        email: data.email,
      });

      return result ? SupplierModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on updating supplier: ${error}`);
      throw error;
    }
  }

  /** Pencarian berhalaman; email sengaja TIDAK ikut dicari, seperti sebelumnya. */
  async fetch(data: IFetch): Promise<{ data: SupplierModel[]; count: number }> {
    try {
      const filter = {
        isDelete: false,
        $or: [
          { name: { $regex: data.keyword, $options: "i" } },
          { address: { $regex: data.keyword, $options: "i" } },
          { phoneNumber: { $regex: data.keyword, $options: "i" } },
          { npwp: { $regex: data.keyword, $options: "i" } },
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
        data: rows.map((row) => SupplierModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching supplier: ${error}`);
      throw error;
    }
  }

  async fetchByID(id: string): Promise<SupplierModel | null> {
    const result = await this.collection.findById(id);
    return result ? SupplierModel.fromMap(result) : null;
  }

  async fetchAutocomplete(keyword: string): Promise<SupplierModel[]> {
    const rows = await this.collection
      .find({
        name: { $regex: new RegExp(keyword, "i") },
        isDelete: false,
      })
      .limit(5)
      .sort({ name: 1 });

    return rows.map((row) => SupplierModel.fromMap(row));
  }

  /** Penandaan terhapus, bukan penghapusan sungguhan. */
  async delete(id: string, userID: string): Promise<SupplierModel | null> {
    const result = await this.collection.findByIdAndUpdate(id, {
      isDelete: true,
      deletedBy: userID,
      deletedAt: new Date(),
    });

    return result ? SupplierModel.fromMap(result) : null;
  }

  async isNameTaken(name: string): Promise<boolean> {
    const count = await this.collection.countDocuments({
      name: name,
      isDelete: false,
    });

    return count !== 0;
  }

  async isNameTakenByOther(data: ISupplierNameCheck): Promise<boolean> {
    const count = await this.collection.countDocuments({
      name: data.name,
      isDelete: false,
      _id: { $ne: data.id },
    });

    return count !== 0;
  }

  async existsActive(id: string): Promise<boolean> {
    const count = await this.collection.countDocuments({
      _id: id,
      isDelete: false,
    });

    return count === 1;
  }
}

export default SupplierRepository;
