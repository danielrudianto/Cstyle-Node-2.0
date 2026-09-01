import { Connection } from "mongoose";
import {
  ICustomer,
  ICustomerFetch,
} from "../interfaces/customer.interface";
import { CustomerModel } from "../models/customer.model";

/**
 * Semua akses database untuk pelanggan.
 *
 * Sambungan disuntikkan lewat constructor, bukan diimpor. Itu yang membuat
 * seluruh proses cukup memakai satu sambungan, dan nanti memungkinkan
 * beberapa repository berbagi satu session kalau operasi lintas koleksi mau
 * dibuat atomik.
 *
 * Query di dalamnya dipindahkan APA ADANYA dari models/customer.model.ts.
 * Beberapa di antaranya punya cacat yang sudah diketahui dan SENGAJA belum
 * disentuh, supaya refactor ini tidak mengubah perilaku:
 *
 *   - update() ikut menulis ulang createdBy dan createdAt setiap kali
 *     pelanggan disunting, sehingga jejak siapa yang membuat data hilang.
 *   - fetch() menyusun regex langsung dari kata kunci pengguna tanpa
 *     escape, jadi karakter khusus mengubah arti query dan pencarian tidak
 *     bisa memakai indeks.
 *   - fetchAutocomplete() memanggil .populate() pada "_id name", padahal
 *     keduanya bukan referensi ke koleksi lain.
 *
 * Ketiganya digarap di tahap perbaikan, bukan di sini.
 */
export class CustomerRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("customer");
  }

  async create(data: ICustomer): Promise<CustomerModel> {
    try {
      const result = await this.collection.create({
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        type: data.type,
        createdBy: data.createdBy,
        createdAt: new Date(),
        email: data.email,
        npwp: data.npwp,
      });

      return CustomerModel.fromMap(result);
    } catch (error) {
      console.error(`[error]: Error on creating customer: ${error}`);
      throw error;
    }
  }

  /**
   * Mengembalikan dokumen SEBELUM perubahan, sama seperti sebelumnya.
   *
   * findByIdAndUpdate tanpa opsi `new: true` membalikkan versi lama. Klien
   * sudah terbiasa dengan bentuk itu, jadi dipertahankan.
   */
  async update(data: ICustomer): Promise<CustomerModel | null> {
    try {
      const result = await this.collection.findByIdAndUpdate(data._id, {
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        type: data.type,
        createdBy: data.createdBy,
        createdAt: new Date(),
        email: data.email,
        npwp: data.npwp,
      });

      return result ? CustomerModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on updating customer: ${error}`);
      throw error;
    }
  }

  /** Pencarian berhalaman, 20 baris per halaman. */
  async fetch(
    data: ICustomerFetch
  ): Promise<{ data: CustomerModel[]; count: number }> {
    try {
      const filter = {
        isDelete: false,
        $or: [
          { name: { $regex: data.keyword, $options: "i" } },
          { address: { $regex: data.keyword, $options: "i" } },
          { phoneNumber: { $regex: data.keyword, $options: "i" } },
          { type: { $regex: data.keyword, $options: "i" } },
          { email: { $regex: data.keyword, $options: "i" } },
          { npwp: { $regex: data.keyword, $options: "i" } },
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
        data: rows.map((row) => CustomerModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching customer: ${error}`);
      throw error;
    }
  }

  /**
   * Autocomplete, hanya untuk tipe bulk dan consignment.
   *
   * Tipe lain mengembalikan daftar kosong tanpa menyentuh database — perilaku
   * lama yang dipertahankan.
   */
  async fetchAutocomplete(
    keyword: string,
    type: string
  ): Promise<CustomerModel[]> {
    if (type !== "bulk" && type !== "consignment") {
      return [];
    }

    try {
      const rows = await this.collection
        .find({
          isDelete: false,
          name: { $regex: new RegExp(keyword, "i") },
          type: type,
        })
        .limit(5);

      return rows.map((row) => CustomerModel.fromMap(row));
    } catch (error) {
      console.error(`[error]: Error on fetching customer autocomplete: ${error}`);
      throw error;
    }
  }

  async fetchByID(id: string): Promise<CustomerModel | null> {
    try {
      const result = await this.collection.findById(id);
      return result ? CustomerModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on fetching customer by id: ${error}`);
      throw error;
    }
  }

  async delete(id: string, userID: string): Promise<CustomerModel | null> {
    try {
      const result = await this.collection.findByIdAndUpdate(id, {
        isDelete: true,
        deletedAt: new Date(),
        deletedBy: userID,
      });

      return result ? CustomerModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on deleting customer: ${error}`);
      throw error;
    }
  }
}

export default CustomerRepository;
