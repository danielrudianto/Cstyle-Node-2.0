import { Connection } from "mongoose";
import { IFetch } from "../interfaces/fetch.interface";
import { IUser, IUserSales } from "../interfaces/user.interface";
import { UserModel } from "../models/user.model";

/**
 * Semua akses database untuk pengguna.
 *
 * Query dipindahkan APA ADANYA dari models/user.model.ts dan
 * models/user-sales.model.ts. Cacat yang diketahui dan sengaja dipertahankan:
 *
 *   - fetch() dan fetchAutocompleteSales() menyusun RegExp langsung dari kata
 *     kunci pengguna tanpa escape.
 *   - fetch() tidak menyaring pengguna yang sudah dinonaktifkan, jadi daftar
 *     yang dikembalikan ikut memuat pengguna yang dihapus.
 *   - isTaken() memeriksa username DAN code sekaligus dengan $or, sehingga
 *     bentrok pada salah satunya menghasilkan pesan yang sama —
 *     USERNAME_ALREADY_EXISTS — meski yang bentrok sebenarnya kode pegawai.
 */
export class UserRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("users");
  }

  async create(data: IUser): Promise<UserModel> {
    try {
      const result = await this.collection.create({
        name: data.name,
        password: data.password,
        username: data.username,
        isActive: data.isActive,
        accessLevel: data.accessLevel,
        code: data.code,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        deletedBy: data.deletedBy,
        deletedAt: data.deletedAt,
      });

      return UserModel.fromMap(result);
    } catch (error) {
      console.error(`[error]: Error on creating user: ${error}`);
      throw error;
    }
  }

  /**
   * Mengembalikan dokumen SEBELUM perubahan, sama seperti sebelumnya.
   *
   * `password` hanya ikut tertulis kalau pemanggil mengisinya; pada penyuntingan
   * biasa nilainya undefined dan Mongoose melewatinya.
   */
  async update(data: IUser): Promise<UserModel | null> {
    try {
      const result = await this.collection.findByIdAndUpdate(data._id, {
        name: data.name,
        password: data.password,
        username: data.username,
        isActive: data.isActive,
        accessLevel: data.accessLevel,
        code: data.code,
      });

      return result ? UserModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on updating user: ${error}`);
      throw error;
    }
  }

  async updatePassword(id: string, hashedPassword: string) {
    try {
      return await this.collection.findByIdAndUpdate(id, {
        password: hashedPassword,
      });
    } catch (error) {
      console.error(`[error]: Error on updating password: ${error}`);
      throw error;
    }
  }

  async fetch(data: IFetch): Promise<{ data: UserModel[]; count: number }> {
    try {
      const filter = {
        $or: [
          { username: RegExp(data.keyword, "i") },
          { code: RegExp(data.keyword, "i") },
          { name: RegExp(data.keyword, "i") },
        ],
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(filter)
          .limit(20)
          .skip((data.page - 1) * 20)
          .sort({ name: 1 }),
        this.collection.countDocuments(filter),
      ]);

      return {
        data: rows.map((row) => UserModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching user: ${error}`);
      throw error;
    }
  }

  /**
   * MELEMPAR galat kalau pengguna tidak ditemukan, bukan mengembalikan null.
   *
   * Perilaku ini berbeda dari repository lain dan dipertahankan karena
   * pemanggilnya — worker.controller — mengandalkan lemparan itu untuk
   * menggagalkan job.
   */
  async fetchByID(id: string): Promise<UserModel> {
    try {
      const result = await this.collection.findById(id);
      if (!result) throw new Error("User not found.");
      return UserModel.fromMap(result);
    } catch (error: unknown) {
      throw new Error(error?.toString() ?? "An unknown error occurred.");
    }
  }

  /** Mengembalikan null kalau tidak ditemukan. */
  async fetchByIDOrNull(id: string): Promise<UserModel | null> {
    try {
      const result = await this.collection.findById(id);
      return result ? UserModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on fetching user by id: ${error}`);
      throw error;
    }
  }

  /** Dipakai auth.interceptor untuk mengenali pegawai dari kode di header. */
  async fetchActiveByCode(code: string): Promise<UserModel | null> {
    const result = await this.collection.findOne({
      code: code,
      isActive: true,
    });

    return result ? UserModel.fromMap(result) : null;
  }

  async fetchByUsername(username: string): Promise<UserModel | null> {
    try {
      const result = await this.collection.findOne({ username });
      return result ? UserModel.fromMap(result) : null;
    } catch (error: unknown) {
      throw new Error(error?.toString() ?? "An unknown error occurred.");
    }
  }

  /** Semua pengguna aktif — dipakai sinkronisasi cache Redis dan migrasi. */
  async fetchActive(): Promise<UserModel[]> {
    try {
      const rows = await this.collection.find({ isActive: true });
      return rows.map((row) => UserModel.fromMap(row));
    } catch (error: unknown) {
      throw new Error(error?.toString() ?? "An unknown error occurred.");
    }
  }

  /** Penonaktifan, bukan penghapusan sungguhan. */
  async delete(id: string, userID: string): Promise<UserModel | null> {
    try {
      const result = await this.collection.findByIdAndUpdate(id, {
        isActive: false,
        deletedBy: userID,
        deletedAt: new Date(),
      });

      return result ? UserModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on deleting user: ${error}`);
      throw error;
    }
  }

  /** Username ATAU kode pegawai sudah dipakai. */
  async isTaken(username: string, code: string): Promise<boolean> {
    const count = await this.collection.countDocuments({
      $or: [{ username: username }, { code: code }],
    });

    return count !== 0;
  }

  /** Sama seperti isTaken(), tapi mengabaikan pengguna yang sedang disunting. */
  async isTakenByOther(
    username: string,
    code: string,
    id: string
  ): Promise<boolean> {
    const count = await this.collection.countDocuments({
      $or: [{ username: username }, { code: code }],
      _id: { $ne: id },
    });

    return count !== 0;
  }

  /** Autocomplete sales — hanya pengguna aktif dengan accessLevel 2. */
  async fetchAutocompleteSales(keyword: string): Promise<IUserSales[]> {
    const users = await this.collection.find({
      isActive: true,
      accessLevel: 2,
      name: { $regex: new RegExp(keyword, "i") },
    });

    return users.map((x) => ({
      name: x.name,
      _id: x._id.toString(),
    }));
  }
}

export default UserRepository;
