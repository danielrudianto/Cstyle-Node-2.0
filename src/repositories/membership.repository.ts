import { Connection } from "mongoose";
import { IFetch } from "../interfaces/fetch.interface";
import {
  IMembership,
  IMembershipPoint,
} from "../interfaces/membership.interface";
import {
  MembershipModel,
  MembershipPointModel,
} from "../models/membership.model";

/**
 * Semua akses database untuk keanggotaan dan kurs poinnya.
 *
 * Dua koleksi digabung di satu repository karena kursnya tidak berdiri
 * sendiri — ia hanya dipakai untuk menghitung poin anggota.
 *
 * ============================ CACAT PENTING ============================
 *
 * create() TIDAK MENYIMPAN `birthday` DAN `storeID`.
 *
 * Kedua bidang itu dikirim controller dan ada di skema koleksinya, tetapi
 * tidak pernah ikut ditulis — persis pola yang sama dengan kartu stok barang
 * masuk yang hilang. Akibatnya:
 *
 *   - Ulang tahun anggota tidak pernah tersimpan.
 *   - Setiap anggota tercatat tanpa toko, sehingga countMembers(storeID) dan
 *     countNewMembers(storeID) SELALU mengembalikan nol, dan pengelompokan
 *     per toko pada count() jatuh ke satu grup null.
 *
 * Dipertahankan apa adanya karena refactor ini tidak mengubah perilaku.
 * Memperbaikinya hanya menyentuh anggota BARU; yang lama butuh pembetulan
 * data tersendiri, dan storeID lama sudah tidak bisa dipulihkan dari mana pun.
 * =======================================================================
 */
export class MembershipRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("memberships");
  }

  private get pointCollection() {
    return this.conn.model("membership-points");
  }

  /** Lihat catatan di atas: `birthday` dan `storeID` sengaja tidak ikut. */
  async create(data: IMembership): Promise<MembershipModel> {
    try {
      const result = await this.collection.create({
        name: data.name,
        code: data.code,
        point: data.point,
        email: data.email,
        phoneNumber: data.phoneNumber,
        nationality: data.nationality,
        language: data.language,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
      });

      return MembershipModel.fromMap(result);
    } catch (error) {
      console.error(`[error]: Error on creating membership: ${error}`);
      throw error;
    }
  }

  /** Mengembalikan dokumen SEBELUM perubahan, sama seperti sebelumnya. */
  async update(data: IMembership): Promise<MembershipModel | null> {
    try {
      const result = await this.collection.findByIdAndUpdate(data._id, {
        name: data.name,
        point: data.point,
        email: data.email,
        phoneNumber: data.phoneNumber,
        nationality: data.nationality,
        language: data.language,
      });

      return result ? MembershipModel.fromMap(result) : null;
    } catch (error) {
      console.error(`[error]: Error on updating membership: ${error}`);
      throw error;
    }
  }

  /**
   * Pencarian berhalaman.
   *
   * TIDAK menyaring anggota terhapus — koleksi ini memang tidak punya
   * penanda hapus sama sekali.
   */
  async fetch(data: IFetch): Promise<{ data: MembershipModel[]; count: number }> {
    try {
      const filter = {
        $or: [
          { name: { $regex: data.keyword, $options: "i" } },
          { code: { $regex: data.keyword, $options: "i" } },
          { nationality: { $regex: data.keyword, $options: "i" } },
        ],
      };

      const [rows, count] = await Promise.all([
        this.collection
          .find(filter)
          .populate("storeID", "name")
          .sort({ name: 1 })
          .limit(20)
          .skip((data.page - 1) * 20),
        this.collection.countDocuments(filter),
      ]);

      return {
        data: rows.map((row) => MembershipModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching membership: ${error}`);
      throw error;
    }
  }

  async fetchByID(id: string): Promise<MembershipModel | null> {
    const result = await this.collection
      .findById(id)
      .populate("storeID", "name");

    return result ? MembershipModel.fromMap(result) : null;
  }

  async fetchByCode(code: string): Promise<MembershipModel | null> {
    const result = await this.collection.findOne({ code: code });
    return result ? MembershipModel.fromMap(result) : null;
  }

  /**
   * Mencari beberapa anggota sekaligus BERDASARKAN KODE, bukan id.
   *
   * Namanya menyesatkan di kode lama (`fetchByIDs`) — yang dicocokkan adalah
   * `code`, karena perangkat kasir menyimpan kode anggota, bukan ObjectId.
   */
  async fetchByCodes(codes: string[]): Promise<MembershipModel[]> {
    const rows = await this.collection.find({ code: { $in: codes } });
    return rows.map((row) => MembershipModel.fromMap(row));
  }

  /** Jumlah anggota per toko, dan jumlah anggota per kewarganegaraan. */
  count() {
    return Promise.all([
      this.collection.aggregate([
        { $group: { _id: "$storeID", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "stores",
            localField: "_id",
            foreignField: "_id",
            as: "store",
          },
        },
        { $unwind: { path: "$store" } },
      ]),
      this.collection.aggregate([
        { $group: { _id: "$nationality", count: { $sum: 1 } } },
      ]),
    ]);
  }

  /** Anggota baru dalam 30 hari terakhir. */
  countNewMembers(storeID: string | null = null): Promise<number> {
    const sejak = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.collection.countDocuments(
      storeID == null
        ? { createdAt: { $gte: sejak } }
        : { storeID: storeID, createdAt: { $gte: sejak } }
    );
  }

  countMembers(storeID: string | null = null): Promise<number> {
    return this.collection.countDocuments(
      storeID == null ? {} : { storeID: storeID }
    );
  }

  /** Menambah poin; nilai negatif mengurangi. */
  updatePoint(memberID: string, point: number) {
    return this.collection.findByIdAndUpdate(memberID, {
      $inc: { point: point },
    });
  }

  async isCodeTaken(code: string): Promise<boolean> {
    const count = await this.collection.countDocuments({ code: code });
    return count !== 0;
  }

  /* --------------------------- kurs poin --------------------------- */

  async createConversion(data: IMembershipPoint): Promise<MembershipPointModel> {
    const result = await this.pointCollection.create({
      conversion: data.conversion,
      createdBy: data.createdBy,
      createdAt: new Date(),
    });

    return MembershipPointModel.fromMap(result);
  }

  /** Riwayat kurs, 10 baris per halaman, terbaru dulu. */
  async fetchConversions(
    page: number
  ): Promise<{ data: MembershipPointModel[]; count: number }> {
    const [rows, count] = await Promise.all([
      this.pointCollection
        .find({})
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .skip((page - 1) * 10),
      this.pointCollection.countDocuments({}),
    ]);

    return {
      data: rows.map((row) => MembershipPointModel.fromMap(row)),
      count: count,
    };
  }

  async fetchCurrentConversion(): Promise<MembershipPointModel | null> {
    const result = await this.pointCollection
      .findOne({})
      .sort({ createdAt: -1 });

    return result ? MembershipPointModel.fromMap(result) : null;
  }

  /** Kurs baru ditolak kalau nilainya sama dengan yang sedang berlaku. */
  async isConversionUnchanged(conversion: number): Promise<boolean> {
    const current = await this.fetchCurrentConversion();
    if (current == null) {
      return false;
    }

    return current.conversion === conversion;
  }
}

export default MembershipRepository;
