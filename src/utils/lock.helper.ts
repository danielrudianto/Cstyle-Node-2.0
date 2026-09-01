import AsyncLock from "async-lock";

/**
 * Kunci dalam-proses untuk operasi yang tidak boleh berjalan bersamaan —
 * terutama pengurangan stok dan penyimpanan nota.
 *
 * ==================== maxExecutionTime DIBUANG ====================
 *
 * Sebelumnya berkas ini hanya berisi `{ maxExecutionTime: 2000 }`, dan pilihan
 * itu justru meniadakan gunanya kunci pada saat kunci paling dibutuhkan.
 *
 * Yang dilakukan async-lock ketika batas itu terlampaui (lib/index.js, sekitar
 * baris 141) adalah memanggil `done(locked, new Error(...))`. Dan `done`
 * dengan `locked` bernilai benar MELEPAS kuncinya lalu MENJALANKAN ANTREAN
 * BERIKUTNYA. Yang TIDAK dilakukannya: menghentikan tugas yang sedang berjalan
 * — tidak ada yang bisa membatalkannya.
 *
 * Jadi sesudah dua detik, tugas pertama masih menulis ke database sementara
 * tugas kedua sudah dipersilakan masuk. Saling-kunci itu berhenti berlaku
 * tanpa satu pun tanda, dan pemanggilnya menerima galat sehingga membalas 500.
 *
 * Dua detik jauh lebih pendek daripada kelihatannya. Satu kelompok
 * sinkronisasi berisi dua puluh nota dengan sepuluh barang menjalankan dua
 * ratus findOneAndUpdate berurutan; tanpa indeks { itemID, storeID } tiap
 * panggilan memindai koleksi penuh. Begitu MongoDB melambat — persis keadaan
 * sesudah ia baru pulih dan tumpukan sinkronisasi masuk berbarengan — batas
 * itu terlampaui pada hampir setiap permintaan sekaligus.
 *
 * Akibatnya berantai: kunci lepas, dua penyimpanan berjalan bersamaan, nomor
 * nota yang sama tertulis dua kali dan ditolak indeks unique sebagai E11000,
 * stok berkurang dua kali, klien menerima 500 lalu mengulang, dan pengulangan
 * itu menambah beban yang menyebabkan keadaannya.
 *
 * ==================== YANG DIPAKAI SEKARANG ====================
 *
 * `timeout` adalah tombol yang aman. Ia membatasi lama MENUNGGU giliran, bukan
 * lama menjalankan tugas, jadi yang gagal adalah penunggunya — saling-kunci
 * tidak pernah dilanggar. Permintaan yang menyerah membalas galat yang jujur;
 * yang tidak pernah terjadi adalah dua penulisan berjalan bersisian.
 *
 * Dua puluh detik dipilih supaya lebih longgar daripada kelompok sinkronisasi
 * terbesar yang wajar, tetapi masih lebih pendek daripada tenggat nginx —
 * sehingga yang menyerah adalah aplikasinya, dengan pesan yang bisa dibaca di
 * log, bukan gerbangnya dengan 504 yang tidak menjelaskan apa-apa.
 *
 * Konsekuensi yang perlu diketahui: tugas yang benar-benar tersangkut kini
 * memegang kuncinya sampai selesai. Itu disengaja. Tersangkut lalu terlihat
 * lebih baik daripada diam-diam berjalan ganda.
 *
 * BATASNYA: kunci ini hidup di dalam SATU proses. Selama API berjalan sebagai
 * satu layanan systemd, itu cukup. Begitu ia dijalankan lebih dari satu
 * instansi, penjagaan ini tidak berlaku lagi dan yang tersisa hanya indeks
 * unique di database.
 */
const lock = new AsyncLock({
  timeout: 20000,
});

export default lock;
