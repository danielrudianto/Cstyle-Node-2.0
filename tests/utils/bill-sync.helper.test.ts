import { pilahNotaKiriman } from "../../src/utils/bill-sync.helper";

/*
  Pemilahan nota kasir.

  Yang dijaga di sini bukan kerapian, melainkan satu kerugian tertentu: nota
  yang terjadi di toko tetapi tidak pernah sampai ke server, tanpa siapa pun
  tahu. Setiap uji di bawah menutup satu jalan menuju keadaan itu.
*/
describe("pilahNotaKiriman", () => {
  const waktu = "2026-09-01T03:15:22.000Z";

  it("meneruskan nota yang benar-benar baru", () => {
    const hasil = pilahNotaKiriman(
      [{ name: "B-CS-2026-09-000000000001", createdAt: waktu }],
      []
    );

    expect(hasil.perluDisimpan).toHaveLength(1);
    expect(hasil.sudahTersimpan).toHaveLength(0);
    expect(hasil.bentrok).toHaveLength(0);
  });

  /*
    Inti perbaikannya. Sebelum ini kiriman ulang dibuang dari balasan, jadi
    perangkat tidak pernah menandainya selesai dan mengirimkannya lagi setiap
    tiga puluh detik tanpa akhir.
  */
  it("mengakui kiriman ulang alih-alih membuangnya", () => {
    const nama = "B-CS-2026-09-000000000002";
    const hasil = pilahNotaKiriman(
      [{ name: nama, createdAt: waktu }],
      [{ name: nama, createdAt: new Date(waktu) }]
    );

    expect(hasil.perluDisimpan).toHaveLength(0);
    expect(hasil.sudahTersimpan).toHaveLength(1);
    expect(hasil.sudahTersimpan[0].name).toBe(nama);
    expect(hasil.bentrok).toHaveLength(0);
  });

  /*
    Yang tersimpan berupa Date, yang dikirim berupa teks ISO. Membandingkannya
    tanpa pengecoran membuat SETIAP kiriman ulang terbaca sebagai tabrakan —
    perbaikannya justru berbalik jadi kerusakan.
  */
  it("menyamakan Date dengan teks ISO yang nilainya sama", () => {
    const nama = "B-CS-2026-09-000000000003";
    const hasil = pilahNotaKiriman(
      [{ name: nama, createdAt: waktu }],
      [{ name: nama, createdAt: new Date(waktu) }]
    );

    expect(hasil.sudahTersimpan).toHaveLength(1);
    expect(hasil.bentrok).toHaveLength(0);
  });

  /*
    Nomor sama tetapi transaksinya berbeda. Mengakuinya berarti menyuruh
    perangkat menautkan nota barunya ke nota lama milik orang lain, dan nota
    barunya hilang. Harus masuk daftar bentrok, bukan daftar diakui.
  */
  it("menandai nomor kembar untuk transaksi berbeda sebagai bentrok", () => {
    const nama = "B-CS-2026-09-000000000004";
    const hasil = pilahNotaKiriman(
      [{ name: nama, createdAt: "2026-09-01T09:00:00.000Z" }],
      [{ name: nama, createdAt: new Date("2026-09-01T03:15:22.000Z") }]
    );

    expect(hasil.perluDisimpan).toHaveLength(0);
    expect(hasil.sudahTersimpan).toHaveLength(0);
    expect(hasil.bentrok).toEqual([nama]);
  });

  /*
    Dua nota bernama sama di dalam SATU kiriman. Tanpa penjagaan, keduanya
    lolos ke insertMany dan indeks unique menolak seluruh kelompoknya — satu
    nota bermasalah menjatuhkan semua nota lain yang sebenarnya baik-baik saja.
  */
  it("tidak meloloskan dua nota bernama sama dalam satu kiriman", () => {
    const nama = "B-CS-2026-09-000000000005";
    const hasil = pilahNotaKiriman(
      [
        { name: nama, createdAt: "2026-09-01T09:00:00.000Z" },
        { name: nama, createdAt: "2026-09-01T09:04:00.000Z" },
      ],
      []
    );

    expect(hasil.perluDisimpan).toHaveLength(1);
    expect(hasil.bentrok).toEqual([nama]);
  });

  it("mengakui kiriman ulang ganda hanya sekali", () => {
    const nama = "B-CS-2026-09-000000000006";
    const hasil = pilahNotaKiriman(
      [
        { name: nama, createdAt: waktu },
        { name: nama, createdAt: waktu },
      ],
      [{ name: nama, createdAt: new Date(waktu) }]
    );

    expect(hasil.sudahTersimpan).toHaveLength(1);
    expect(hasil.perluDisimpan).toHaveLength(0);
    expect(hasil.bentrok).toHaveLength(0);
  });

  /* Satu kiriman lazimnya bercampur; ketiganya harus terpilah sekaligus. */
  it("memilah kiriman campuran", () => {
    const hasil = pilahNotaKiriman(
      [
        { name: "baru", createdAt: waktu },
        { name: "ulang", createdAt: waktu },
        { name: "bentrok", createdAt: "2026-09-01T10:00:00.000Z" },
      ],
      [
        { name: "ulang", createdAt: new Date(waktu) },
        { name: "bentrok", createdAt: new Date(waktu) },
      ]
    );

    expect(hasil.perluDisimpan.map((x) => x.name)).toEqual(["baru"]);
    expect(hasil.sudahTersimpan.map((x) => x.name)).toEqual(["ulang"]);
    expect(hasil.bentrok).toEqual(["bentrok"]);
  });

  /*
    Tanggal tak terbaca tidak boleh terhitung sama. NaN === NaN bernilai false
    di JavaScript, tetapi getTime() pada dua tanggal rusak sama-sama NaN — dan
    perbandingan yang ceroboh bisa membuat keduanya lolos sebagai kiriman
    ulang, lalu menautkan nota ke dokumen yang salah.
  */
  it("tidak menganggap dua tanggal rusak sebagai kiriman ulang", () => {
    const nama = "B-CS-2026-09-000000000007";
    const hasil = pilahNotaKiriman(
      [{ name: nama, createdAt: "bukan tanggal" }],
      [{ name: nama, createdAt: "juga bukan" }]
    );

    expect(hasil.sudahTersimpan).toHaveLength(0);
    expect(hasil.bentrok).toEqual([nama]);
  });

  it("mengembalikan hasil kosong untuk kiriman kosong", () => {
    const hasil = pilahNotaKiriman([], []);

    expect(hasil.perluDisimpan).toHaveLength(0);
    expect(hasil.sudahTersimpan).toHaveLength(0);
    expect(hasil.bentrok).toHaveLength(0);
  });
});
