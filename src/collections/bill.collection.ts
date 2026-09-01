import { model, Schema } from "mongoose";

const BillItem = new Schema({
  itemID: { type: Schema.Types.ObjectId, ref: "items", required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  discount: { type: Number, required: true },
  percentage: { type: Number, required: true },
});

const BillPayment = new Schema({
  type: { type: String, required: true },
  amount: { type: Number, required: true },
});

const BillSchema = new Schema({
  /*
    TIDAK lagi unique secara global — keunikannya sekarang gabungan
    { storeID, name }, dipasang di bawah.

    Nomornya dibuat di perangkat kasir dari delapan digit acak tanpa kode
    toko, sementara keunikan global memperlakukan angka yang sama dari toko
    berbeda sebagai tabrakan. Yang ditolak lalu dibuang diam-diam oleh
    sinkronisasi. Dengan toko ikut masuk kunci, keduanya sah berdampingan.

    Indeks lama harus dibuang di server; Mongoose tidak membuang indeks yang
    sudah ada sendiri. Lihat scripts/migrate-bill-name-index.js.
  */
  name: { type: String, required: true },
  date: { type: Date, required: true },
  storeID: { type: Schema.Types.ObjectId, ref: "stores", required: true },
  memberID: {
    type: Schema.Types.ObjectId,
    ref: "memberships",
    required: false,
  },
  items: [BillItem],
  payment: [BillPayment],
  createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
  createdAt: { type: Date, required: true },
  isDelete: { type: Boolean, required: true, default: false },
  deletedAt: { type: Date, required: false, default: null },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: false,
    default: null,
  },
  isHidden: {
    type: Boolean,
    required: true,
    default: false,
  },
  point: { type: Number, required: true, default: 0 },
});

/*
  Keunikan nomor nota berlaku PER TOKO.

  Aman dipasang pada data yang ada: selama ini `name` unique global, jadi tiap
  pasangan { storeID, name } dengan sendirinya juga sudah unik.
*/
BillSchema.index({ storeID: 1, name: 1 }, { unique: true });

export default BillSchema;
