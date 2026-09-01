import { Request, Response } from "express";
import moment from "moment";
import { pilahNotaKiriman } from "../utils/bill-sync.helper";
import { ErrorList } from "../constants/error-list.constant";
import { BillInterface } from "../interfaces/bill.interface";
import { LoggerType } from "../interfaces/logger.interface";
import { IStock } from "../interfaces/stock.interface";
import { BillRepository } from "../repositories/bill.repository";
import { ItemRepository } from "../repositories/item.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { StockRepository } from "../repositories/stock.repository";
import { StoreRepository } from "../repositories/store.repository";
import lock from "../utils/lock.helper";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk aplikasi kasir.
 *
 * Controller ini menyentuh empat domain sekaligus — barang, stok, toko,
 * keanggotaan, dan nota — karena satu perangkat kasir memang memakai
 * kelimanya lewat satu pintu.
 */
export class CashierController {
  private itemRepository: ItemRepository;
  private stockRepository: StockRepository;
  private storeRepository: StoreRepository;
  private membershipRepository: MembershipRepository;
  private billRepository: BillRepository;

  constructor(
    itemRepository: ItemRepository,
    stockRepository: StockRepository,
    storeRepository: StoreRepository,
    membershipRepository: MembershipRepository,
    billRepository: BillRepository
  ) {
    this.itemRepository = itemRepository;
    this.stockRepository = stockRepository;
    this.storeRepository = storeRepository;
    this.membershipRepository = membershipRepository;
    this.billRepository = billRepository;
  }

  /**
   * Menerima kiriman nota dari perangkat kasir yang sedang luring.
   *
   * PEMERIKSAAN STOK DIMATIKAN.
   *
   * Kode lama memuat blok pemeriksaan ketersediaan stok yang seluruhnya
   * dikomentari, sehingga nota masuk tanpa pernah diperiksa dan stok bisa
   * menjadi minus. Blok komentar itu TIDAK dibawa ke sini — isinya sudah ada
   * di riwayat git — tapi perilakunya dipertahankan: tidak ada pemeriksaan.
   *
   * Akibat lain dari matinya pemeriksaan itu: kunci di bawah kini tidak
   * melindungi apa pun, karena tidak ada lagi urutan baca-lalu-tulis yang
   * perlu dijaga. Kuncinya tetap dipasang supaya perilaku antriannya sama.
   */
  sync = async (req: Request, res: Response) => {
    const storeID = req.body.storeID;
    const data = req.body.data as any[];

    try {
      /*
        SELURUH badan sinkronisasi berada di dalam satu kunci per toko.

        Sebelumnya pemeriksaan "nota mana yang sudah ada" berjalan di LUAR
        segala kunci, dan penyimpanannya baru dikunci per barang. Di antara
        keduanya ada celah: dua permintaan sinkronisasi dari toko yang sama —
        lazimnya satu perangkat yang mengulang karena balasan sebelumnya belum
        sampai — sama-sama membaca "belum ada", lalu sama-sama menyimpan. Yang
        kedua ditolak indeks unique sebagai E11000, seluruh kelompoknya gagal,
        dan perangkatnya mengulang lagi.

        Kunci per barang tidak menutup celah itu karena ia diambil SESUDAH
        pemeriksaan. Kunci per toko diambil sebelum, jadi pemeriksaan dan
        penyimpanan menjadi satu langkah yang tidak dapat disisipi.

        Dipilih per toko, bukan satu kunci global, supaya enam toko tetap dapat
        menyinkronkan bersamaan; yang diserialkan hanya permintaan yang memang
        bisa saling bertabrakan.

        Kunci per barang di dalam TIDAK dibuang — ia masih menjaga stok dari
        endpoint lain (faktur, penyesuaian, penerimaan barang) yang menyentuh
        baris stok yang sama. Urutan pengambilannya selalu toko lalu barang,
        dan tidak ada jalur lain yang mengambil keduanya terbalik, jadi tidak
        ada kemungkinan saling menunggu.
      */
      await lock.acquire(`sinkronisasi:${storeID}`, async () => {
        /*
          DUA CACAT YANG DIPERBAIKI DI SINI.

          Bentuk lama: cari nota yang namanya sudah ada (TANPA memandang toko),
          buang dari kiriman, lalu balas hanya yang baru tersimpan. Aplikasi
          kasir menandai nota sebagai "sudah tersinkron" HANYA untuk yang muncul
          di balasan. Akibatnya:

          1. Nota toko A yang nomornya kebetulan sama dengan nota toko B
             dianggap sudah ada lalu dibuang. Nomornya delapan digit acak tanpa
             kode toko, dipakai bersama enam toko — sekitar 27% kemungkinan
             bentrok tiap bulan. Nota itu HILANG tanpa jejak di mana pun.

          2. Bila sambungan putus SESUDAH server menyimpan tetapi SEBELUM
             balasannya sampai, perangkat mengirim ulang. Server melihatnya
             sudah ada lalu membuangnya dari balasan — jadi perangkat tidak
             pernah menandainya tersinkron dan mengirim ulang lagi tiap tiga
             puluh detik, selamanya. Ini yang paling sering kejadian; putus
             jaringan di kasir jauh lebih lumrah daripada tabrakan angka.

          Sekarang pencocokannya per toko, dan nota yang memang sudah tersimpan
          IKUT DIBALAS supaya perangkat berhenti mengulang.
        */
        const existingBills = await this.billRepository.fetchExistingByStore(
          storeID,
          data.map((x) => x.name)
        );

        /*
          Pemilahannya ada di utils/bill-sync.helper.ts bersama penjelasan
          lengkapnya, supaya bisa diuji tanpa database maupun express.
        */
        const { perluDisimpan, sudahTersimpan, bentrok } = pilahNotaKiriman(
          data,
          existingBills as any[]
        );

        if (bentrok.length > 0) {
          /*
            Dicatat sebagai galat, bukan dibalas. Bentuk balasannya berupa larik
            dokumen nota dan versi aplikasi yang sudah terpasang di enam toko
            membacanya begitu; menyisipkan penanda penolakan di situ akan
            merusaknya. Sampai aplikasinya diperbarui, yang bentrok memang
            dibiarkan mengulang — bedanya sekarang ia TERLIHAT di journalctl,
            bukan hilang tanpa jejak seperti sebelumnya.
          */
          new LoggerHelper({
            message:
              `Bill number collision within store ${storeID}: ` +
              `${bentrok.join(", ")}. NOT saved; the terminal will keep ` +
              `retrying until these are renumbered.`,
            type: LoggerType.error,
            tag: "Cashier",
          }).log();
        }

        const memberCodeSet = new Set<string>();
        const bills: any[] = [];

        for (const x of perluDisimpan) {
          if (x.memberID != null) {
            memberCodeSet.add(x.memberID);
          }

          bills.push(
            ({
              name: x.name,
              /*
                Tanggal dipangkas menjadi "YYYY-MM-DD" lalu dicor Mongoose ke
                tengah malam UTC — bukan waktu setempat. Untuk toko di WITA/WIB
                itu menggeser sebagian transaksi ke tanggal sebelumnya pada
                laporan harian. Dipertahankan apa adanya.
              */
              date: moment(x.date).format("YYYY-MM-DD"),
              memberID: x.memberID,
              storeID: storeID,
              createdBy: x.createdBy,
              createdAt: new Date(x.createdAt),
              items: (x.bills as any[]).map((a) => ({
                itemID: a.itemID,
                quantity: a.quantity,
                price: a.price,
                discount: (a.discount * a.price) / 100,
                percentage: a.discount,
              })),
              payment: (x.payments as any[]).map((b) => ({
                type: b.paymentMethod,
                amount: b.amount,
              })),
            })
          );
        }

        const members = await this.membershipRepository.fetchByCodes([
          ...memberCodeSet,
        ]);

        /*
          Nota yang menyebut anggota tak dikenal DILEWATI, bukan ditolak.

          Ini pembuangan diam-diam yang ketiga, dan perilakunya sengaja tidak
          diubah — menyimpannya tanpa anggota berarti memutuskan sesuatu tentang
          poin belanja yang bukan urusan lapisan ini. Yang ditambahkan hanya
          catatannya, supaya nota yang tersangkut mengulang selamanya punya
          jejak yang bisa ditelusuri.
        */
        const modifiedBills: BillInterface[] = [];
        const anggotaTakDikenal: string[] = [];
        for (const x of bills) {
          const member = members.find((y: any) => y.code == x.memberID);
          if (x.memberID != null && member == null) {
            anggotaTakDikenal.push(x.name);
            continue;
          }

          modifiedBills.push({
            ...x,
            /*
              `_id` sekarang berupa teks, bukan ObjectId — Mongoose mengecornya
              sendiri saat penyimpanan, jadi yang tersimpan tetap sama.
            */
            memberID: (x.memberID == null ? null : member!._id) as any,
          });
        }

        if (anggotaTakDikenal.length > 0) {
          new LoggerHelper({
            message:
              `Skipped ${anggotaTakDikenal.length} bill(s) from store ` +
              `${storeID} referencing unknown members: ` +
              `${anggotaTakDikenal.join(", ")}. The terminal will keep ` +
              `retrying them.`,
            type: LoggerType.error,
            tag: "Cashier",
          }).log();
        }

        /*
          Kalau seluruh kiriman ternyata sudah tersimpan, balas di sini. Tanpa
          jalan pintas ini kita mengambil kunci untuk himpunan barang kosong dan
          memanggil insertMany([]) tanpa keperluan — dan justru inilah keadaan
          yang paling sering terjadi pada perangkat yang tersangkut mengulang.
        */
        if (modifiedBills.length === 0) {
          return res.status(200).send(sudahTersimpan);
        }

        const kunciBarang = new Set<string>();
        for (const bill of modifiedBills) {
          for (const item of bill.items) {
            kunciBarang.add(`${item.itemID.toString()}:${storeID}`);
          }
        }

        await lock.acquire([...kunciBarang], async (done) => {
          try {
            const result = await this.billRepository.insertMany(modifiedBills);

            /*
              SATU perjalanan untuk stok, SATU untuk antrean.

              Sebelumnya keduanya ada di dalam perulangan bersarang: satu
              findOneAndUpdate per barang per nota, lalu satu queue.add per
              nota, semuanya berurutan. Dua puluh nota berisi sepuluh barang
              berarti dua ratus perjalanan ke MongoDB dan dua puluh ke Redis —
              untuk pekerjaan yang muat dalam dua perintah.

              Karena seluruh badan ini berjalan di dalam kunci per toko,
              lamanya perjalanan itu persis lamanya toko lain menunggu
              gilirannya.

              Urutannya juga menjadi lebih aman. Kalau penulisan stok gagal,
              tidak ada satu pun job yang terlanjur diantrekan; bentuk lama
              meninggalkan sebagian nota sudah berkurang stoknya sementara
              sebagian job sudah berjalan.
            */
            const perubahanStok: IStock[] = [];
            for (const bill of result) {
              for (const item of bill.items) {
                perubahanStok.push({
                  itemID: item.itemID,
                  quantity: item.quantity * -1,
                  storeID: bill.storeID,
                });
              }
            }

            await this.stockRepository.incrementMany(perubahanStok);

            await queue.addBulk(
              result.map((bill: any) => ({
                name: "createBill",
                data: { id: bill._id },
              }))
            );

            done();

            new LoggerHelper({
              message: `Success on creating bill from ${storeID}`,
              type: LoggerType.info,
              tag: "Cashier",
            }).log();

            /*
              Yang sudah tersimpan ikut dibalas. Bentuk balasannya tetap larik
              berisi dokumen nota — aplikasi kasir membaca result[i]['name'] dan
              result[i]['_id'] — jadi versi yang sudah terpasang di enam toko
              tidak perlu diperbarui untuk mendapat perbaikan ini.
            */
            return res.status(200).send([...result, ...sudahTersimpan]);
          } catch (error) {
            new LoggerHelper({
              message: `Error on creating bill ${error}`,
              type: LoggerType.error,
              tag: "Cashier",
            }).log();

            done();

            return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
          }
        });
      });
    } catch (error) {
      /*
        Kode lama tidak memasang penangkap galat di rantai terluar, sehingga
        kegagalan di sini berakhir sebagai unhandled rejection dan permintaan
        menggantung sampai perangkat kasir menyerah. Sekarang dibalas 500.
      */
      new LoggerHelper({
        message: `Error on syncing bills ${error}`,
        type: LoggerType.error,
        tag: "Cashier",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  stats = async (req: Request, res: Response) => {
    try {
      const [newMember, totalMember, [billCount, billSales]] =
        await Promise.all([
          this.membershipRepository.countNewMembers(req.body.storeID),
          this.membershipRepository.countMembers(req.body.storeID),
          this.billRepository.countBills(
            req.body.storeID,
            Number(req.query.period as string)
          ),
        ]);

      return res
        .status(200)
        .send([
          newMember,
          totalMember,
          billCount,
          billSales.length == 0 ? 0 : Math.round(billSales[0].value),
        ]);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching stats ${error}`,
        type: LoggerType.error,
        tag: "Cashier",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Menukar kode toko 32 karakter menjadi bentuk UUID lalu mencarinya.
   *
   * Aplikasi kasir menyimpan kodenya tanpa tanda hubung di SharedPreference,
   * sedangkan yang tersimpan di database berbentuk UUID. Karena itu kodenya
   * disusun ulang di sini.
   */
  checkStore = async (req: Request, res: Response) => {
    const uid = req.params.storeCode;

    if (!uid.match(/^[0-9a-fA-F]{32}$/)) {
      return res.status(400).send(ErrorList["INVALID_STORE_UID"]);
    }

    const formattedUID = [
      uid.substring(0, 8),
      uid.substring(8, 12),
      uid.substring(12, 16),
      uid.substring(16, 20),
      uid.substring(20, 32),
    ].join("-");

    try {
      const result = await this.storeRepository.fetchByCode(
        formattedUID.toLowerCase()
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching store ${error}`,
        tag: "Store",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchStock = async (req: Request, res: Response) => {
    try {
      const result = await this.stockRepository.fetchByStoreID(
        req.body.storeID
      );

      return res.status(200).send(
        result.map((x) => ({
          mongoID: x.itemID,
          stock: x.quantity,
        }))
      );
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching stock data ${error}`,
        type: LoggerType.error,
        tag: "Cashier",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchReport = async (req: Request, res: Response) => {
    try {
      const bills = await this.billRepository.fetchStoreReport(req.body.storeID);

      const paymentMethods = [
        "cash",
        "card",
        "qris",
        "bank transfer",
        "voucher",
        "grab",
        "paypal",
      ];

      const payments = paymentMethods.map((x) => ({ type: x, value: 0 }));

      for (const bill of bills) {
        for (const payment of bill.payment as any[]) {
          const index = payments.findIndex(
            (x) => x.type.toLowerCase() === payment.type.toLowerCase()
          );

          /*
            Daftar metode pembayaran di atas ditulis tetap di kode. Metode yang
            tidak ada di daftar menghasilkan index -1, dan kode lama langsung
            menulis ke payments[-1] sehingga permintaannya gagal dengan 500 —
            itulah yang terjadi saat "grab" ditambahkan di sisi kasir sebelum
            daftar ini menyusul. Penjagaan di bawah membuat metode tak dikenal
            DILEWATI, bukan menjatuhkan seluruh laporan.
          */
          if (index === -1) {
            new LoggerHelper({
              message: `Unknown payment type "${payment.type}" on store ${req.body.storeID}`,
              type: LoggerType.warning,
              tag: "Cashier",
            }).log();
            continue;
          }

          payments[index].value += payment.amount;
        }
      }

      return res.status(200).send({
        count: bills.length,
        payments: payments,
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching report ${error}`,
        type: LoggerType.error,
        tag: "Cashier",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  checkStock = async (req: Request, res: Response) => {
    try {
      const [{ data: result, count }, stores] = await Promise.all([
        this.itemRepository.fetch({
          keyword: req.body.keyword,
          page: req.body.page,
          onlyActive: true,
        }),
        this.storeRepository.fetchOthers(req.body.storeID),
      ]);

      const stocks = await this.stockRepository.fetchGroupedByStore(
        result.map((x: any) => x._id)
      );

      const stokPerBarang = new Map<string, any[]>();
      for (const z of stocks) {
        const kunci = z._id.itemID.toString();
        const wadah = stokPerBarang.get(kunci);
        if (wadah) {
          wadah.push(z);
        } else {
          stokPerBarang.set(kunci, [z]);
        }
      }

      return res.status(200).send({
        store: stores,
        data: result.map((x: any) => ({
          id: x._id,
          reference: x.reference,
          description: x.description,
          brand: x.itemBrandID == null ? "" : x.itemBrandID.name,
          type: x.itemTypeID == null ? "" : x.itemTypeID.name,
          stock: (stokPerBarang.get(x._id.toString()) ?? []).map((z) => ({
            storeID: z._id.storeID,
            quantity: z.quantity,
          })),
        })),
        count: count,
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching stock ${error}`,
        tag: "Cashier",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchBill = async (req: Request, res: Response) => {
    try {
      const result = await this.billRepository.fetchStore({
        storeID: req.body.storeID as string,
        page:
          req.query.page == undefined ? 1 : Number(req.query.page as string),
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching bill ${error}`,
        type: LoggerType.error,
        tag: "Cashier",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchBillByID = async (req: Request, res: Response) => {
    try {
      const result = await this.billRepository.fetchByID(req.params.id);

      /*
        req.body.storeID hanya terisi kalau pemanggil masuk lewat header toko.
        Pada jalur token JWT nilainya undefined, dan pembandingan di bawah
        gagal dengan galat — berakhir sebagai 500. Perilaku itu dipertahankan;
        perbaikannya ada di auth.interceptor, bukan di sini.
      */
      if (result.storeID.toString() != req.body.storeID.toString()) {
        return res.status(403).send(ErrorList["ACCESS_DENIED"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching bill by ID ${error}`,
        type: LoggerType.error,
        tag: "Cashier",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };
}

export default CashierController;
