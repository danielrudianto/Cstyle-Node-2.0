import mongoose, { Connection } from "mongoose";

import AdjustmentEventSchema from "../collections/adjustment-event.collection";
import BillSchema from "../collections/bill.collection";
import CustomerSchema from "../collections/customer.collection";
import DeliverySlipSchema from "../collections/delivery-slip.collection";
import GoodReceiptSchema from "../collections/good-receipt.collection";
import InvoiceSchema from "../collections/invoice.collection";
import ItemSchema from "../collections/item.collection";
import ItemBrandSchema from "../collections/item-brand.collection";
import ItemTypeSchema from "../collections/item-type.collection";
import MembershipSchema from "../collections/membership.collection";
import MigrationSchema from "../collections/migration.collection";
import OverflowSchema from "../collections/overflow.collection";
import PackingListSchema from "../collections/packing-list.collection";
import PointSchema from "../collections/point.collection";
import PurchaseInvoiceSchema from "../collections/purchase-invoice.collection";
import QuotationSchema from "../collections/quotation.collection";
import StockSchema from "../collections/stock.collection";
import StockCardSchema from "../collections/stock-card.collection";
import StockInSchema from "../collections/stock-in.collection";
import StockOutSchema from "../collections/stock-out.collection";
import StockRequestSchema from "../collections/stock-request.collection";
import StoreSchema from "../collections/store.collection";
import SupplierSchema from "../collections/supplier.collection";
import UserSchema from "../collections/user.collection";

/**
 * Satu sambungan MongoDB untuk seluruh proses.
 *
 * Sebelumnya connectionFactory() dipanggil di tingkat modul oleh 26 berkas —
 * setiap model, ditambah auth.interceptor — dan tiap panggilan membuka
 * sambungan BARU: pool soket sendiri, monitor topologi sendiri, dan salinan
 * ke-25 skema sendiri. Dua proses (API dan worker) berarti 52 sambungan ke
 * satu database yang sama.
 *
 * Selain borosnya, sambungan yang terpisah membuat dua repository tidak bisa
 * berbagi session — dan tanpa session bersama, transaksi MongoDB tidak
 * mungkin dipakai. Jadi memoisasi di sini bukan sekadar penghematan, tapi
 * prasyarat kalau nanti operasi stok mau dibuat atomik.
 *
 * Sambungannya dipakai bersama, jadi JANGAN memanggil conn.close() dari
 * dalam repository mana pun.
 */
let connection: Connection | null = null;

/**
 * Alamat database masih ditulis di sini, sama seperti sebelumnya.
 *
 * Memindahkannya ke environment variable adalah perubahan yang benar, tapi
 * itu menyentuh cara deploy dan sengaja tidak digabung ke refactor struktur
 * ini supaya kalau ada yang rusak, penyebabnya jelas.
 */
const MONGO_URL = "mongodb://127.0.0.1:27017";
const DB_NAME = "Cstyle";

/** Mendaftarkan seluruh skema ke sambungan yang baru dibuat. */
function registerCollections(conn: Connection): void {
  conn.model("migrations", MigrationSchema);
  conn.model("adjustment-event", AdjustmentEventSchema);
  conn.model("bills", BillSchema);
  conn.model("delivery-slips", DeliverySlipSchema);
  conn.model("good-receipt", GoodReceiptSchema);
  conn.model("invoices", InvoiceSchema);
  conn.model("memberships", MembershipSchema);

  /*
    Skema yang sama didaftarkan dua kali dengan nama berbeda, dan keduanya
    menunjuk KOLEKSI YANG SAMA.

    Mongoose menurunkan nama koleksi dari nama model dengan menambahkan "s",
    jadi "membership-point" dan "membership-points" sama-sama menjadi
    koleksi `membership-points`. Jadi ini hanya nama ganda, bukan data yang
    terpecah — menghapus salah satunya aman selama tidak ada lagi kode yang
    memanggil conn.model() dengan nama itu.

    Aturan penurunan nama yang sama juga berlaku di tempat lain dan mudah
    membingungkan saat memeriksa data langsung lewat mongosh:

      conn.model("good-receipt")     -> koleksi good-receipts
      conn.model("adjustment-event") -> koleksi adjustment-events
      conn.model("purchase-invoice") -> koleksi purchase-invoices
      conn.model("customer")         -> koleksi customers
  */
  conn.model("membership-points", PointSchema);
  conn.model("membership-point", PointSchema);

  conn.model("packing-lists", PackingListSchema);
  conn.model("purchase-invoice", PurchaseInvoiceSchema);
  conn.model("quotations", QuotationSchema);
  conn.model("stock-requests", StockRequestSchema);
  conn.model("stores", StoreSchema);
  conn.model("users", UserSchema);
  conn.model("customer", CustomerSchema);
  conn.model("itembrands", ItemBrandSchema);
  conn.model("itemtypes", ItemTypeSchema);
  conn.model("items", ItemSchema);
  conn.model("suppliers", SupplierSchema);

  conn.model("stock-ins", StockInSchema);
  conn.model("stock-outs", StockOutSchema);
  conn.model("stock-cards", StockCardSchema);
  conn.model("stocks", StockSchema);
  conn.model("overflows", OverflowSchema);
}

/**
 * Mengembalikan sambungan bersama, membuatnya pada pemanggilan pertama saja.
 *
 * Namanya dipertahankan supaya berkas model lama yang belum dipindah ke
 * repository tetap jalan tanpa diubah selama masa transisi.
 */
export function connectionFactory(): Connection {
  if (connection) {
    return connection;
  }

  connection = mongoose.createConnection(MONGO_URL, {
    dbName: DB_NAME,
    autoCreate: true,
  });

  registerCollections(connection);

  return connection;
}

/** Sambungan bersama, untuk disuntikkan ke repository. */
export const conn = connectionFactory();
