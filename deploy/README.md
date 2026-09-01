# Deploy

Backend ini berjalan sebagai dua layanan systemd: `cstyle-api` dan
`cstyle-worker`. Keduanya WAJIB hidup — penjelasannya di bawah.

## Sehari-hari

```bash
sudo ./scripts/deploy.sh
```

Skrip itu menarik perubahan, menyelaraskan paket, membangun, menjalankan uji,
menyelaraskan indeks, lalu menyalakan ulang kedua layanan dan memastikan
API benar-benar menjawab.

Pilihan lain:

```bash
sudo ./scripts/deploy.sh --periksa        # bangun + uji saja, layanan tidak disentuh
sudo ./scripts/deploy.sh --lewati-uji     # lebih cepat, untuk perbaikan mendesak
sudo ./scripts/deploy.sh --lewati-indeks  # lewati penyelarasan indeks
```

Jalankan `--periksa` lebih dulu kalau ragu: ia berhenti sebelum menyentuh
basis data maupun layanan.

## Pindah dari PM2 (sekali saja)

Sebelumnya kedua proses dijalankan PM2. Langkah di bawah memindahkannya ke
systemd. Ada jeda mati beberapa detik.

**1. Pasang unit file.**

```bash
sudo cp deploy/cstyle-api.service deploy/cstyle-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
```

Periksa dulu isinya kalau jalur atau nama penggunanya berbeda dari:

- `WorkingDirectory=/home/danielrudianto/Cstyle-Node-2.0`
- `User=danielrudianto`

**2. Pastikan hasil build ada.**

`dist/` tidak lagi ikut dikomit, jadi ia harus dibangun di server:

```bash
npm ci && npm run build
```

**3. Matikan PM2, nyalakan systemd.**

Berurutan, jangan dibalik — dua proses yang memegang porta yang sama akan
membuat yang kedua mati saat start, dan gejalanya membingungkan.

```bash
pm2 delete server worker
pm2 save
sudo systemctl enable --now cstyle-api cstyle-worker
```

**4. Cabut PM2 dari startup.**

Tanpa ini, PM2 menyala lagi setiap kali server reboot dan merebut porta dari
systemd.

```bash
pm2 unstartup systemd
```

**5. Pastikan hidup.**

```bash
systemctl status cstyle-api cstyle-worker --no-pager
curl -o /dev/null -s -w 'HTTP %{http_code}\n' http://127.0.0.1:5000/
```

Jawaban 404 sudah benar — aplikasi ini memang tidak punya endpoint di akar
alamat. Yang salah adalah kode `000`, yang berarti tidak ada jawaban sama
sekali.

## Kenapa worker tidak boleh dilupakan

Worker bukan pelengkap. Dialah yang menjalankan mesin FIFO: setiap nota yang
masuk dari kasir menghasilkan job `insertStockOut`, dan job itulah yang
menghitung harga pokok penjualan.

Tanpa worker, API tetap menjawab seperti biasa dan tidak ada yang terlihat
salah — nota tetap tersimpan, stok tetap berkurang. Yang tidak terjadi adalah
perhitungan harga pokoknya. Ketahuannya baru saat laporan dibuka, mungkin
berhari-hari kemudian.

Karena itu `deploy.sh` selalu menyalakan ulang keduanya.

## Melihat log

PM2 punya `pm2 logs`; padanannya di systemd:

```bash
sudo journalctl -u cstyle-api -f              # ikuti langsung
sudo journalctl -u cstyle-worker -n 100       # seratus baris terakhir
sudo journalctl -u cstyle-api --since '10 min ago'
```

Aplikasi juga menulis ke `logs/debug.log` dan `logs/error.log` lewat
`@ptkdev/logger`, tetapi jurnal systemd lebih dapat diandalkan: ia menangkap
juga galat yang terjadi sebelum logger sempat menyala.

## Kalau layanan gagal menyala

Tiga penyebab yang paling sering, berurut dari yang paling sering:

1. **`.env` tidak terbaca.** Layanan berjalan sebagai `danielrudianto`. Kalau
   `git pull` dijalankan sebagai root, berkasnya berganti pemilik dan layanan
   mati berulang tanpa pesan. `deploy.sh` mengembalikan kepemilikan di akhir;
   kalau menjalankan langkahnya manual, kerjakan sendiri:
   `sudo chown -R danielrudianto:danielrudianto .`

2. **`dist/` kosong.** Sejak `dist/` tidak lagi dikomit, `git pull` saja tidak
   cukup. Harus `npm run build`.

3. **MongoDB atau Redis belum siap.** Unit file sudah menyebut keduanya di
   `After=`, tetapi `After=` hanya mengatur urutan — bukan kesiapan. Kalau
   MongoDB lambat menyala, `Restart=always` akan mencobanya lagi tiap 5 detik
   sampai berhasil.
