import { Connection } from "mongoose";
import {
  IBill,
  IBillDelete,
  IBillFetch,
  IBillVisibility,
  IStoreBillFetch,
} from "../interfaces/bill.interface";
import { BillModel } from "../models/bill.model";
import { monthFilter } from "../utils/period.helper";

/**
 * Semua akses database untuk nota kasir.
 *
 * Nota TIDAK dibuat di sini — ia lahir di perangkat kasir saat luring, lalu
 * dikirim berkelompok lewat endpoint sinkronisasi. Karena itu tidak ada
 * create(), hanya insertMany().
 *
 * ==================== NOMOR NOTA BENTROK ====================
 *
 * Nomor nota dibuat di perangkat masing-masing dari digit acak tanpa kode
 * toko, jadi keunikannya bersandar pada peluang. Dulu `bills.name` bertanda
 * unique SECARA GLOBAL: dengan sekitar 8.000 nota sebulan pada ruang seratus
 * juta, peluang dua toko mendapat angka sama mencapai ~27% per bulan, dan
 * sinkronisasi membuang yang kalah tanpa jejak.
 *
 * Sekarang keunikannya gabungan { storeID, name }, dan fetchExistingByStore()
 * di bawah mencocokkan toko juga — dua toko yang mendapat angka sama bukan
 * lagi tabrakan. Aplikasi kasir juga sudah dilebarkan menjadi dua belas digit,
 * yang menurunkan peluang tabrakan di dalam satu toko ke sekitar 0,003% per
 * bulan.
 *
 * Indeks unique lama pada `name` harus dibuang di server; Mongoose tidak
 * membuang indeks yang sudah ada. Skripnya scripts/migrate-bill-name-index.js.
 *
 * Pemilahan kiriman ulang dari tabrakan sungguhan ada di
 * utils/bill-sync.helper.ts, dan pemakainya di cashier.controller.ts.
 * ============================================================
 *
 * CACAT LAIN YANG DIPERTAHANKAN.
 *
 *   - fetchStatus() mengembalikan angka HARIAN dua kali. Agregat pertama dan
 *     kedua identik — keduanya memakai `todayDate` — sementara `weekDate`
 *     dihitung lalu tidak pernah dipakai. Jadi "penjualan mingguan" pada
 *     papan status sebenarnya angka harian.
 *
 *   - Masih pada fetchStatus(): `todayDate` adalah waktu SEKARANG, bukan
 *     tengah malam, jadi penyaring `date >= todayDate` melewatkan nota hari
 *     ini yang tanggalnya tersimpan sebagai tengah malam. Dan `monthDate`
 *     mundur 300 hari, bukan 30.
 */
export class BillRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("bills");
  }

  /**
   * Penyaring bulan yang BISA memakai indeks.
   *
   * Bentuk sebelumnya memakai $expr dengan $month/$year, yang memaksa
   * MongoDB menghitung bulan tiap dokumen dan membuat indeks tidak
   * terpakai. Rentang tanggal di UTC memberi hasil yang sama persis —
   * penjelasannya di utils/period.helper.ts.
   */
  private periodFilter(month: number, year: number) {
    return monthFilter("date", month, year);
  }

  /** Menyimpan sekelompok nota hasil sinkronisasi perangkat kasir. */
  insertMany(data: IBill[]) {
    return this.collection.insertMany(data);
  }

  /**
   * Nota milik SATU TOKO yang namanya ada di antara daftar yang dikirim.
   *
   * Dipakai sinkronisasi untuk mengenali kiriman ulang.
   *
   * DULU MENCOCOKKAN NAMA SAJA, TANPA TOKO.
   *
   * Nomor nota dibuat di perangkat masing-masing dari delapan digit acak tanpa
   * kode toko, sementara indeks unique-nya berlaku global. Akibatnya nota dari
   * toko A yang kebetulan bernomor sama dengan nota toko B dianggap "sudah
   * ada", lalu dibuang tanpa jejak — dan perangkatnya mencoba lagi setiap tiga
   * puluh detik selamanya karena tidak pernah menerima balasan untuknya.
   *
   * Dengan toko ikut dicocokkan, dua toko yang mendapat angka sama bukan lagi
   * tabrakan. Yang tersisa hanya tabrakan di dalam satu toko, yang jauh lebih
   * jarang dan ditangani terpisah oleh pemanggilnya.
   */
  fetchExistingByStore(storeID: any, names: string[]) {
    return this.collection.find({ storeID: storeID, name: { $in: names } });
  }

  /**
   * Pencarian nota dari aplikasi kantor.
   *
   * Empat cabang di kode lama — pemilik/bukan, dengan/tanpa toko — disatukan
   * menjadi satu penyaring yang dibangun bertahap. Hasilnya sama persis.
   */
  async fetch(data: IBillFetch): Promise<{ data: BillModel[]; count: number }> {
    try {
      const filter: any = {
        name: RegExp(data.keyword, "i"),
        /* Klien mengirim bulan gaya JavaScript, 0 - 11. */
        ...this.periodFilter(data.month + 1, data.year),
      };

      /* Pemilik tidak melihat nota yang disembunyikan dari laporan. */
      if (data.isOwner) {
        filter.isHidden = false;
      }

      if (data.storeID.length > 0) {
        filter.storeID = { $in: data.storeID };
      }

      const [rows, count] = await Promise.all([
        this.collection
          .find(filter)
          .sort({ date: -1 })
          .populate("createdBy", "name")
          .populate("memberID", "code name")
          .populate("storeID", "name")
          .limit(20)
          .skip((data.page - 1) * 20),
        this.collection.countDocuments(filter),
      ]);

      return {
        data: rows.map((row) => BillModel.fromMap(row)),
        count: count,
      };
    } catch (error) {
      console.error(`[error]: Error on fetching bill: ${error}`);
      throw error;
    }
  }

  /** Nota HARI INI untuk satu toko, dipakai layar riwayat di perangkat kasir. */
  async fetchStore(
    data: IStoreBillFetch
  ): Promise<{ data: BillModel[]; count: number }> {
    const filter = {
      storeID: data.storeID,
      isDelete: false,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    };

    const [rows, count] = await Promise.all([
      this.collection
        .find(filter)
        .sort({ date: -1 })
        .populate("createdBy", "name")
        .populate("memberID", "code name")
        .limit(20)
        .skip((data.page - 1) * 20),
      this.collection.countDocuments(filter),
    ]);

    return {
      data: rows.map((row) => BillModel.fromMap(row)),
      count: count,
    };
  }

  fetchByID(id: string) {
    return this.collection
      .findById(id)
      .populate("memberID", "code name")
      .populate("createdBy", "name")
      .populate("items.itemID", "_id reference description");
  }

  /** Nilai penjualan sejak satu tanggal, dijumlahkan dari baris barangnya. */
  private sumSince(since: Date) {
    return this.collection.aggregate([
      { $match: { date: { $gte: since }, isDelete: false } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          value: {
            $sum: {
              $multiply: [
                { $subtract: ["$items.price", "$items.discount"] },
                "$items.quantity",
              ],
            },
          },
        },
      },
      { $project: { _id: 0, value: "$value" } },
    ]);
  }

  /**
   * Angka penjualan untuk papan status: harian, mingguan, dua mingguan, bulanan.
   *
   * PERHATIAN: nilai kedua memakai tanggal yang SAMA dengan yang pertama —
   * itu cacat kode lama yang dipertahankan, sehingga "mingguan" sebenarnya
   * mengulang angka harian. `weekDate` dihitung tapi tidak dipakai, persis
   * seperti sebelumnya. Dan `monthDate` mundur 300 hari, bukan 30.
   */
  fetchStatus() {
    const todayDate = new Date();
    const weekDate = new Date();
    const biweekDate = new Date();
    const monthDate = new Date();

    weekDate.setDate(todayDate.getDate() - 7);
    biweekDate.setDate(todayDate.getDate() - 14);
    monthDate.setDate(todayDate.getDate() - 300);

    return Promise.all([
      this.sumSince(new Date(todayDate)),
      this.sumSince(new Date(todayDate)),
      this.sumSince(new Date(biweekDate)),
      this.sumSince(new Date(monthDate)),
    ]);
  }

  /** Nota satu bulan untuk laporan penjualan. */
  fetchReport(
    storeID: string | null,
    month: number,
    year: number,
    shownOnly: boolean = true
  ) {
    const query: any = this.periodFilter(month, year);
    if (shownOnly) query.isHidden = false;
    if (storeID) query.storeID = storeID;

    return this.collection
      .find(query)
      .populate("createdBy", "name")
      .populate("memberID", "_id code name")
      .populate("storeID", "name");
  }

  /** Nota satu bulan beserta barangnya, untuk laporan per produk. */
  fetchProductReport(
    storeID: string | null,
    month: number,
    year: number,
    shownOnly: boolean = true
  ) {
    const query: any = this.periodFilter(month, year);
    if (storeID) query.storeID = storeID;
    if (shownOnly) query.isHidden = false;

    return this.collection
      .find(query)
      .populate({
        path: "items.itemID",
        model: "items",
        select: "reference description _id itemTypeID",
        populate: { path: "itemTypeID", select: "name" },
      })
      .populate("storeID", "name")
      .populate("memberID", "code")
      .populate("createdBy", "name");
  }

  /** Nota hari ini untuk satu toko, dipakai laporan tutup kasir. */
  fetchStoreReport(storeID: string) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    return this.collection.find({
      storeID: storeID,
      isDelete: false,
      $and: [{ date: { $gte: date } }, { date: { $lte: new Date() } }],
    });
  }

  /** Jumlah transaksi anggota dalam 30 hari terakhir. */
  fetchMemberTransactions(): Promise<number> {
    return this.collection.countDocuments({
      memberID: { $ne: null },
      isDelete: false,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
  }

  /**
   * Jumlah dan nilai nota satu toko dalam `period` hari terakhir.
   *
   * `period` bernilai -1 berarti sepanjang waktu.
   */
  countBills(storeID: string, period: number) {
    const filter: any = { isDelete: false, storeID: storeID };

    if (period !== -1) {
      filter.date = {
        $gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000),
      };
    }

    return Promise.all([
      this.collection.countDocuments(filter),
      this.collection.aggregate([
        { $match: filter },
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            value: {
              $sum: {
                $multiply: [
                  { $subtract: ["$items.price", "$items.discount"] },
                  "$items.quantity",
                ],
              },
            },
          },
        },
        { $project: { _id: 0, value: "$value" } },
      ]),
    ]);
  }

  /** Menyembunyikan atau memunculkan kembali nota pada laporan. */
  updateVisibility(data: IBillVisibility[]) {
    return Promise.all(
      data.map((item) =>
        this.collection.findByIdAndUpdate(item.id, {
          isHidden: item.isHidden,
        })
      )
    );
  }

  delete(data: IBillDelete) {
    return this.collection.findByIdAndUpdate(data.id, {
      isDelete: true,
      deletedBy: data.userID,
      deletedAt: new Date(),
    });
  }
}

export default BillRepository;
