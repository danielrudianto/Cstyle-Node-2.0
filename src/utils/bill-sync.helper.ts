/**
 * Pemilahan nota yang dikirim kasir terhadap nota yang sudah tersimpan.
 *
 * MASALAH YANG DISELESAIKAN DI SINI.
 *
 * Nomor nota dibuat di perangkat kasir, bukan di server — memang harus begitu,
 * kasir wajib tetap melayani saat internet mati. Konsekuensinya server bisa
 * menerima nama yang sudah dipakai, dan ia harus bisa membedakan dua keadaan
 * yang gejalanya identik tetapi penanganannya berlawanan:
 *
 *   KIRIMAN ULANG. Sambungan putus sesudah server menyimpan tetapi sebelum
 *   balasannya sampai. Perangkat mengira gagal lalu mengirim lagi nota yang
 *   sama persis. Yang benar: akui: balas nota yang sudah tersimpan itu supaya
 *   perangkat menandainya selesai dan berhenti mengulang.
 *
 *   TABRAKAN. Dua transaksi berbeda kebetulan mendapat nomor sama. Yang benar:
 *   JANGAN diakui. Mengakuinya berarti menyuruh perangkat menautkan nota
 *   barunya ke nota lama milik transaksi lain — nota barunya lenyap tanpa
 *   jejak, dan itulah kerugian yang paling mahal di seluruh alur ini.
 *
 * PEMBEDANYA createdAt. Waktu itu dibuat perangkat saat transaksinya terjadi
 * dan ikut terkirim apa adanya, jadi pada kiriman ulang nilainya sama persis,
 * sementara dua transaksi berbeda praktis mustahil sama sampai milidetik.
 *
 * Sebelum ini keduanya diperlakukan sama: dibuang dari balasan tanpa jejak.
 * Yang kiriman ulang jadi mengulang selamanya tiap tiga puluh detik, dan yang
 * tabrakan hilang diam-diam.
 */

/** Yang perlu diketahui dari sebuah nota untuk memilahnya. */
export interface PenandaNota {
  name: string;
  createdAt: any;
}

export interface HasilPemilahanNota<TDikirim, TTersimpan> {
  /** Benar-benar baru; lanjut disimpan. */
  perluDisimpan: TDikirim[];
  /** Sudah ada dan memang nota yang itu juga; dibalas supaya diakui. */
  sudahTersimpan: TTersimpan[];
  /** Nomor kembar untuk transaksi berbeda; tidak disimpan, harus terlihat. */
  bentrok: string[];
}

/**
 * Memilah kiriman terhadap yang sudah tersimpan.
 *
 * `tersimpan` HARUS sudah disaring pada toko yang sama. Memadankan lintas toko
 * adalah cacat aslinya: nomornya tidak memuat kode toko, jadi angka yang sama
 * dari toko berbeda bukan tabrakan.
 */
export function pilahNotaKiriman<
  TDikirim extends PenandaNota,
  TTersimpan extends PenandaNota
>(
  dikirim: TDikirim[],
  tersimpan: TTersimpan[]
): HasilPemilahanNota<TDikirim, TTersimpan> {
  const berdasarNama = new Map<string, TTersimpan>();
  for (const nota of tersimpan) {
    berdasarNama.set(nota.name, nota);
  }

  const perluDisimpan: TDikirim[] = [];
  const sudahTersimpan: TTersimpan[] = [];
  const bentrok: string[] = [];

  /*
    Nama yang sudah diputuskan akan disimpan pada putaran ini. Satu kiriman
    bisa saja memuat dua nota bernama sama; tanpa penjagaan ini keduanya lolos
    ke insertMany dan indeks unique menolak SELURUH kelompoknya — satu nota
    bermasalah membuat seluruh kiriman gagal dan diulang tanpa henti.
  */
  const namaTerpakai = new Set<string>();

  for (const nota of dikirim) {
    const adanya = berdasarNama.get(nota.name);

    if (adanya != null) {
      if (waktuSama(adanya.createdAt, nota.createdAt)) {
        /*
          Kiriman ulang. Dibalas sekali saja walau terkirim berkali-kali dalam
          satu kelompok — perangkat hanya perlu tahu nomornya sudah aman.
        */
        if (!namaTerpakai.has(nota.name)) {
          namaTerpakai.add(nota.name);
          sudahTersimpan.push(adanya);
        }
      } else {
        bentrok.push(nota.name);
      }
      continue;
    }

    if (namaTerpakai.has(nota.name)) {
      bentrok.push(nota.name);
      continue;
    }

    namaTerpakai.add(nota.name);
    perluDisimpan.push(nota);
  }

  return { perluDisimpan, sudahTersimpan, bentrok };
}

/**
 * Perbandingan waktu yang tahan bentuk.
 *
 * Yang tersimpan berupa Date dari Mongoose, yang dikirim berupa teks ISO dari
 * JSON. Membandingkan langsung selalu tidak sama walau nilainya identik, dan
 * akibatnya setiap kiriman ulang salah dibaca sebagai tabrakan.
 */
function waktuSama(a: any, b: any): boolean {
  const kiri = new Date(a).getTime();
  const kanan = new Date(b).getTime();

  /* Tanggal tak terbaca menghasilkan NaN, dan NaN !== NaN — tidak dianggap sama. */
  if (Number.isNaN(kiri) || Number.isNaN(kanan)) {
    return false;
  }

  return kiri === kanan;
}
