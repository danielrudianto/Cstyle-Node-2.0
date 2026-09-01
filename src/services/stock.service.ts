import { StockInInterface } from "../interfaces/stock-in.interface";
import {
  RemoveStockInInterface,
  RemoveStockOutInterface,
  StockOutInterface,
  StockOutTempInterface,
  StockOutTransferInterface,
} from "../interfaces/stock-out.interface";
import { IDeleteStockIn } from "../interfaces/stock.interface";
import { OverflowRepository } from "../repositories/overflow.repository";
import { StockCardRepository } from "../repositories/stock-card.repository";
import { StockInRepository } from "../repositories/stock-in.repository";
import { StockOutRepository } from "../repositories/stock-out.repository";
import { StockRepository } from "../repositories/stock.repository";

/**
 * Mesin persediaan: FIFO, harga pokok, kartu stok, dan overflow.
 *
 * Sebelumnya seluruh isi berkas ini tinggal di controllers/worker.controller.ts
 * — 600 baris yang bukan lapisan HTTP sama sekali. Ia dipanggil dari pekerja
 * antrian, bukan dari permintaan web, jadi tempatnya memang di services.
 *
 * CARA KERJANYA.
 *
 * Setiap barang masuk membuat satu baris stock-in dengan `residue` awal sama
 * dengan `quantity`. Setiap barang keluar mengambil dari baris stock-in
 * TERTUA yang masih bersisa, mengurangi residue-nya, lalu mencatat satu baris
 * stock-out yang menunjuk balik ke stock-in itu. Rantai stock-out → stock-in
 * itulah yang membuat harga pokok bisa ditelusuri per penjualan.
 *
 * Kalau tidak ada stock-in bersisa, jumlahnya masuk ke overflow — barang
 * sudah terjual tapi harga pokoknya belum diketahui — dan diselesaikan
 * belakangan oleh checkOverflow() begitu barang masuk lagi.
 *
 * =========================== CATATAN CACAT ===========================
 *
 * Isi berkas ini dipindahkan dari worker.controller.ts, lalu dua cacat di
 * bawah diperbaiki setelah keadaan datanya diperiksa langsung di produksi
 * pada 1 September 2026. Sisanya sengaja dibiarkan: memperbaikinya menyentuh
 * bentuk data atau angka harga pokok, jadi butuh keputusan tersendiri.
 *
 *   [A] SUDAH DIPERBAIKI — insertStockIn() dulu tidak pernah menyimpan kartu
 *       stoknya: objeknya dibangun lalu dibuang karena `.create()` tidak
 *       pernah dipanggil. Terpastikan di produksi pada 1 September 2026:
 *       141.029 baris kartu stok, dan NOL di antaranya untuk barang masuk.
 *       Baris lama tidak ikut terisi oleh perbaikan ini — perlu backfill.
 *
 *   [B] SUDAH DIPERBAIKI — insertStockOutOnly() membandingkan
 *       `stockIn.quantity` padahal yang ia kurangi adalah `residue`. Untuk
 *       stock-in yang sudah terpakai sebagian keduanya berbeda, sehingga
 *       residue bisa menjadi minus dan harga pokoknya salah; kalau quantity
 *       bernilai nol, perulangannya tidak pernah berhenti.
 *
 *       Pemeriksaan produksi menunjukkan jalur ini BELUM PERNAH merusak data
 *       (residue minus: 0, residue > quantity: 0, overflow: 0) — masuk akal,
 *       karena satu-satunya pemanggilnya adalah checkOverflow() dan antrian
 *       overflow tidak pernah terisi. Jadi perbaikan ini murni pencegahan dan
 *       tidak membutuhkan pembetulan data.
 *
 *   [C] fetchFifo() tidak menyaring toko — DAN MEMANG TIDAK BISA. Koleksi
 *       `stock-ins` sama sekali tidak punya bidang storeID di skemanya, jadi
 *       nilai storeID yang dikirim pemanggil dibuang diam-diam oleh Mongoose.
 *       Artinya harga pokok memang dihitung SATU ANTREAN untuk seluruh toko,
 *       bukan per toko. Itu keputusan desain yang perlu ditegaskan, bukan
 *       sekadar penyaring yang lupa dipasang: menambahkannya berarti menambah
 *       kolom baru dan membagi ulang seluruh riwayat FIFO.
 *
 *   [D] Tidak ada transaksi. Pembuatan stock-out dan pengurangan residue
 *       adalah dua tulisan terpisah; kalau proses berhenti di antaranya,
 *       persediaan tertinggal dalam keadaan tidak konsisten.
 *
 *   [E] checkOverflow() memanggil insertStockOutOnly(), yang bisa membuat
 *       baris overflow BARU kalau stoknya masih kurang — dan baris itu akan
 *       diproses lagi pada pemanggilan berikutnya. Tanpa stok masuk, ini
 *       berputar tanpa kemajuan.
 * ===========================================================================
 */
export class StockService {
  private stockRepository: StockRepository;
  private stockInRepository: StockInRepository;
  private stockOutRepository: StockOutRepository;
  private stockCardRepository: StockCardRepository;
  private overflowRepository: OverflowRepository;

  constructor(
    stockRepository: StockRepository,
    stockInRepository: StockInRepository,
    stockOutRepository: StockOutRepository,
    stockCardRepository: StockCardRepository,
    overflowRepository: OverflowRepository
  ) {
    this.stockRepository = stockRepository;
    this.stockInRepository = stockInRepository;
    this.stockOutRepository = stockOutRepository;
    this.stockCardRepository = stockCardRepository;
    this.overflowRepository = overflowRepository;
  }

  /**
   * Mencatat barang masuk, beserta kartu stoknya.
   *
   * PERBAIKAN [A]: kartu stok di bawah sebelumnya tidak pernah tersimpan.
   * Kode lama membangun objeknya di dalam Promise.all tetapi tidak pernah
   * memanggil `.create()`, jadi nilainya hanya konstruktor yang hasilnya
   * dibuang — dan kartu stok tidak punya satu pun baris barang masuk.
   *
   * Kartu stok ditulis SETELAH stock-in berhasil, bukan berbarengan. Kalau
   * penulisan stock-in gagal, kartunya tidak boleh ikut tercatat.
   */
  async insertStockIn(data: StockInInterface) {
    const result = await this.stockInRepository.create({
      date: data.date,
      itemID: data.itemID,
      quantity: data.quantity,
      residue: data.quantity,
      price: data.price,
      goodReceiptID: data.goodReceiptID,
      adjustmentEventID: data.adjustmentEventID,
      storeID: data.storeID,
    });

    await this.stockCardRepository.create({
      itemID: data.itemID,
      storeID: data.storeID,
      quantity: data.quantity,
      date: data.date,
      billID: null,
      invoiceID: null,
      adjustmentEventID: data.adjustmentEventID,
      goodReceiptID: data.goodReceiptID,
      deliverySlipID: null,
      stockInID: result._id.toString(),
    });

    return result._id;
  }

  /**
   * Mencatat barang keluar dengan penelusuran FIFO — jalur yang BENAR.
   *
   * Membandingkan dan mengurangi `residue`, sehingga stock-in yang sudah
   * terpakai sebagian ditangani dengan tepat. Bandingkan dengan
   * insertStockOutOnly() di bawah, yang tidak.
   */
  async insertStockOut(data: StockOutInterface) {
    let quantity = data.quantity;

    while (quantity > 0) {
      const stockIn = await this.stockInRepository.fetchFifo(data.itemID);

      /* Tidak ada stok bersisa: sisanya jadi utang harga pokok. */
      if (!stockIn) {
        await this.overflowRepository.create({
          itemID: data.itemID,
          quantity: quantity,
          billID: data.billID,
          adjustmentEventID: data.adjustmentEventID,
          invoiceID: data.invoiceID,
        });
        break;
      }

      /* Penjagaan yang sama seperti di insertStockOutOnly() — lihat di sana. */
      if (stockIn.residue <= 0) {
        throw new Error(
          `Stock-in ${stockIn._id} has non-positive residue (${stockIn.residue}) for item ${data.itemID}`
        );
      }

      /* Satu baris stock-in cukup menutup seluruh sisa permintaan. */
      if (stockIn.residue >= quantity) {
        await Promise.all([
          this.stockOutRepository.create({
            stockInID: stockIn._id.toString(),
            itemID: data.itemID,
            date: data.date,
            quantity: quantity,
            billID: data.billID,
            adjustmentEventID: data.adjustmentEventID,
            invoiceID: data.invoiceID,
            storeID: data.storeID,
          }),
          this.stockInRepository.updateResidue(stockIn._id, quantity),
        ]);
        break;
      }

      /*
        Belum cukup: habiskan baris ini, lalu lanjut ke stock-in berikutnya.

        Sisa yang diambil DIKUNCI ke variabel lokal sebelum penulisan. Kalau
        dibaca ulang dari `stockIn` setelah await, nilainya bergantung pada
        apakah repository ikut mengubah objek yang dipegang di sini — dan
        kalau iya, pengurangannya menjadi nol dan perulangannya tidak pernah
        maju.
      */
      const diambil = stockIn.residue;

      await Promise.all([
        this.stockOutRepository.create({
          stockInID: stockIn._id.toString(),
          itemID: data.itemID,
          date: data.date,
          quantity: diambil,
          billID: data.billID,
          adjustmentEventID: data.adjustmentEventID,
          invoiceID: data.invoiceID,
          storeID: data.storeID,
        }),
        this.stockInRepository.updateResidue(stockIn._id, diambil),
      ]);

      quantity = quantity - diambil;
    }

    await this.stockCardRepository.create({
      itemID: data.itemID,
      storeID: data.storeID,
      quantity: data.quantity,
      date: data.date,
      billID: data.billID,
      invoiceID: data.invoiceID,
      adjustmentEventID: data.adjustmentEventID,
      goodReceiptID: null,
      deliverySlipID: null,
    });
  }

  /**
   * Varian tanpa kartu stok, dipakai penyelesaian overflow.
   *
   * PERBAIKAN [B]: ketiga perbandingan di bawah dulu memakai
   * `stockIn.quantity` — jumlah saat barang masuk — padahal yang dikurangi
   * adalah `residue`. Untuk stock-in yang sudah terpakai sebagian keduanya
   * berbeda, sehingga jumlah yang diambil melebihi sisa yang benar-benar ada,
   * residue menjadi minus, dan harga pokoknya salah. Kalau `quantity`
   * bernilai nol, baris terakhir mengurangi nol dan perulangannya tidak
   * pernah selesai.
   *
   * Sekarang memakai `residue`, sama seperti insertStockOut().
   *
   * Pemeriksaan produksi menunjukkan jalur ini belum pernah merusak data,
   * karena antrian overflow — satu-satunya pemicunya — tidak pernah terisi.
   * Jadi perbaikan ini tidak mengubah angka mana pun yang sudah ada.
   */
  async insertStockOutOnly(data: StockOutInterface) {
    let quantity = data.quantity;

    while (quantity > 0) {
      const stockIn = await this.stockInRepository.fetchFifo(data.itemID);

      if (!stockIn) {
        await this.overflowRepository.create({
          itemID: data.itemID,
          quantity: quantity,
          billID: data.billID,
          adjustmentEventID: data.adjustmentEventID,
          invoiceID: data.invoiceID,
        });
        break;
      }

      /*
        Penjagaan terakhir. fetchFifo() sudah menyaring residue > 0, tapi
        kalau baris yang cacat lolos, tanpa penjagaan ini perulangannya
        berputar selamanya sambil membanjiri MongoDB dengan query yang sama.
        Lebih baik job-nya gagal dengan pesan jelas.
      */
      if (stockIn.residue <= 0) {
        throw new Error(
          `Stock-in ${stockIn._id} has non-positive residue (${stockIn.residue}) for item ${data.itemID}`
        );
      }

      if (stockIn.residue >= quantity) {
        await Promise.all([
          this.stockOutRepository.create({
            stockInID: stockIn._id.toString(),
            itemID: data.itemID,
            date: data.date,
            quantity: quantity,
            billID: data.billID,
            adjustmentEventID: data.adjustmentEventID,
            invoiceID: data.invoiceID,
            storeID: data.storeID,
          }),
          this.stockInRepository.updateResidue(stockIn._id, quantity),
        ]);
        break;
      }

      /* Sisa dikunci sebelum penulisan — alasannya sama seperti di insertStockOut(). */
      const diambil = stockIn.residue;

      await Promise.all([
        this.stockOutRepository.create({
          stockInID: stockIn._id.toString(),
          itemID: data.itemID,
          date: data.date,
          quantity: diambil,
          billID: data.billID,
          adjustmentEventID: data.adjustmentEventID,
          invoiceID: data.invoiceID,
          storeID: data.storeID,
        }),
        this.stockInRepository.updateResidue(stockIn._id, diambil),
      ]);

      quantity = quantity - diambil;
    }
  }

  /**
   * Membatalkan barang masuk.
   *
   * Stock-out yang sudah terlanjur mengambil dari stock-in ini dipindahkan ke
   * overflow, karena harga pokoknya kehilangan sumbernya.
   */
  async removeStockIn(data: RemoveStockInInterface) {
    const result = await this.stockInRepository.fetchForDeletion(data);

    /*
      Kode lama langsung membaca result._id tanpa memeriksa null, sehingga
      pembatalan yang tidak menemukan barisnya menggagalkan job dengan
      TypeError. Penjagaan di bawah hanya membuat kegagalannya terbaca; job
      tetap gagal, tidak diam-diam dianggap berhasil.
    */
    if (!result) {
      throw new Error(
        `Stock-in not found for item ${data.itemID} (goodReceipt=${data.goodReceiptID}, adjustment=${data.adjustmentCaseID})`
      );
    }

    const stockOuts = await this.stockOutRepository.fetchByStockInID(
      result._id
    );

    for (const x of stockOuts) {
      await this.overflowRepository.create({
        itemID: data.itemID,
        quantity: x.quantity,
        billID: x.billID,
        adjustmentEventID: x.adjustmentEventID,
        invoiceID: x.invoiceID,
      });

      await this.stockOutRepository.deleteByID(x._id);
    }

    const deleteStockIn: IDeleteStockIn = {
      itemID: data.itemID,
      adjustmentEventID: data.adjustmentCaseID,
      goodReceiptID: data.goodReceiptID,
    };

    await this.stockInRepository.delete(deleteStockIn);
  }

  /**
   * Membatalkan barang keluar: sisa dikembalikan, stock-out dihapus.
   *
   * updateResidue dipanggil dengan nilai NEGATIF, yang berarti menambah sisa.
   */
  async removeStockOut(data: RemoveStockOutInterface) {
    const result = await this.stockOutRepository.fetchForDeletion(data);

    /*
      Ditunggu satu per satu. Kode lama memakai forEach dengan callback async,
      sehingga fungsinya selesai sebelum satu pun tulisan benar-benar terjadi
      dan pekerja antrian menandai job-nya berhasil terlalu dini.
    */
    for (const x of result) {
      await this.stockInRepository.updateResidue(x.stockIn._id, x.quantity * -1);
      await this.stockOutRepository.deleteByID(x._id);
    }
  }

  /** Kartu stok saja, tanpa menyentuh FIFO — dipakai surat jalan sementara. */
  async insertStockOutCardOnly(data: StockOutTempInterface) {
    await this.stockCardRepository.create({
      itemID: data.itemID,
      quantity: Math.abs(data.quantity) * -1,
      date: data.date,
      billID: null,
      invoiceID: null,
      adjustmentEventID: null,
      goodReceiptID: null,
      deliverySlipID: data.deliverySlipID,
    });

    await this.stockRepository.increment({
      itemID: data.itemID,
      quantity: Math.abs(data.quantity) * -1,
      storeID: null,
    });
  }

  async removeStockOutCardOnly(data: StockOutTempInterface) {
    await this.stockCardRepository.deleteByDeliverySlipID(data.deliverySlipID);

    await this.stockRepository.increment({
      itemID: data.itemID,
      quantity: Math.abs(data.quantity),
      storeID: null,
    });
  }

  /** Pemindahan antar toko: hanya jumlah berjalan, tidak menyentuh FIFO. */
  async stockOutTransfer(data: StockOutTransferInterface) {
    await this.stockRepository.increment({
      itemID: data.itemID,
      quantity: Math.abs(data.quantity) * -1,
      storeID: data.storeID,
    });

    return true;
  }

  async stockInTransfer(data: StockOutTransferInterface) {
    await this.stockRepository.increment({
      itemID: data.itemID,
      quantity: Math.abs(data.quantity),
      storeID: data.storeID,
    });

    return true;
  }

  /**
   * Mencoba menyelesaikan utang harga pokok yang tertahan di overflow.
   *
   * CACAT [E]: jalur penyelesaiannya adalah insertStockOutOnly(), yang bisa
   * membuat baris overflow BARU kalau stoknya masih belum cukup. Baris baru
   * itu akan diproses lagi pada pemanggilan berikutnya, jadi tanpa barang
   * masuk prosesnya berputar tanpa kemajuan.
   *
   * Dipanggil LANGSUNG di sini, bukan lewat antrian seperti kode lama, supaya
   * pekerjaannya benar-benar selesai sebelum job dinyatakan sukses.
   */
  async checkOverflow() {
    const overflows = await this.overflowRepository.fetchAll();

    for (const overflow of overflows) {
      await this.insertStockOutOnly({
        quantity: overflow.quantity,
        itemID: overflow.itemID,
        billID: overflow.billID,
        invoiceID: overflow.invoiceID,
        adjustmentEventID: overflow.adjustmentEventID,
        storeID: null,
        date: new Date(),
      });

      await this.overflowRepository.deleteByID(overflow._id);
    }
  }
}

export default StockService;
