#!/usr/bin/env bash
#
# Deploy Cstyle — backend.
#
# Menggantikan urutan yang selama ini diketik tangan:
#
#   git pull && npm ci && npm run build && systemctl restart api worker
#
# Bedanya bukan sekadar lebih singkat. Skrip ini BERHENTI pada kegagalan
# pertama. Menempel beberapa perintah sekaligus di terminal tidak melakukan
# itu — bila `npm run build` gagal, layanan tetap dinyalakan ulang dan yang
# berjalan adalah dist/ lama, sementara git sudah menunjuk commit baru.
#
# Pemakaian:
#   ./scripts/deploy.sh                  # tarik, pasang, bangun, uji, nyalakan ulang
#   ./scripts/deploy.sh --periksa        # hanya periksa; layanan tidak disentuh
#   ./scripts/deploy.sh --lewati-uji     # tanpa menjalankan jajaran uji
#   ./scripts/deploy.sh --lewati-indeks  # tanpa menyelaraskan indeks MongoDB

set -euo pipefail

AKAR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$AKAR"

LAYANAN_API="cstyle-api"
LAYANAN_WORKER="cstyle-worker"
PENGGUNA_LAYANAN="danielrudianto"
BASIS_DATA="Cstyle"

merah()  { printf '\033[31m%s\033[0m\n' "$*"; }
hijau()  { printf '\033[32m%s\033[0m\n' "$*"; }
kuning() { printf '\033[33m%s\033[0m\n' "$*"; }

gagal() {
  merah "GAGAL: $*"
  exit 1
}

HANYA_PERIKSA=0
LEWATI_UJI=0
LEWATI_INDEKS=0
for arg in "$@"; do
  case "$arg" in
    --periksa)       HANYA_PERIKSA=1 ;;
    --lewati-uji)    LEWATI_UJI=1 ;;
    --lewati-indeks) LEWATI_INDEKS=1 ;;
    *)               gagal "pilihan tidak dikenal: $arg" ;;
  esac
done

# ---------------------------------------------------------------------
# 0. Prasyarat
# ---------------------------------------------------------------------
[[ -e "$AKAR/.env" ]] || gagal "tidak ada berkas lingkungan (.env)"

# .env memuat AUTHORIZATION_KEY dan REFRESH_AUTHORIZATION_KEY. Tanpa keduanya
# proses tetap menyala — JWT.verify baru gagal saat permintaan pertama masuk,
# dan gejalanya berupa 401 pada semua orang, bukan galat saat start.
for kunci in AUTHORIZATION_KEY REFRESH_AUTHORIZATION_KEY PORT; do
  grep -qE "^${kunci}=" "$AKAR/.env" || gagal ".env tidak memuat ${kunci}"
done

# Pohon kerjanya milik pengguna layanan, bukan milik yang mengetik. Skrip ini
# menulis ke node_modules/ dan dist/ lalu mengembalikan kepemilikannya di
# akhir, jadi ia memang dijalankan sebagai root di server ini.
if [[ $EUID -ne 0 ]] && [[ ! -w "$AKAR/node_modules" || ! -w "$AKAR/.git" ]]; then
  gagal "pohon ini milik $(stat -c '%U' "$AKAR"), bukan $USER — jalankan: sudo ./scripts/deploy.sh"
fi

# Git menolak bekerja pada repo milik pengguna lain — "detected dubious
# ownership" — dan di server ini kombinasi itu justru normal: berkasnya milik
# pengguna layanan, sementara administrasinya dikerjakan sebagai root.
if [[ $EUID -eq 0 ]]; then
  git config --global --get-all safe.directory 2>/dev/null | grep -qx "$AKAR" ||
    git config --global --add safe.directory "$AKAR"
fi

git rev-parse HEAD > /dev/null 2>&1 || gagal "bukan repo git yang berisi commit"

# ---------------------------------------------------------------------
# 1. Tarik perubahan
# ---------------------------------------------------------------------
SEBELUM="$(git rev-parse HEAD)"
SESUDAH="$SEBELUM"

if [[ $HANYA_PERIKSA -eq 0 ]]; then
  echo "==> Menarik perubahan"

  # `npm install` mengubah package-lock.json, dan itu menghentikan `git pull`
  # di tengah. Berkas itu selalu boleh dibuang di server: yang berlaku adalah
  # yang ada di repo.
  if ! git diff --quiet -- package-lock.json; then
    kuning "    package-lock.json berubah setempat — dikembalikan"
    git checkout -- package-lock.json
  fi

  if ! git diff --quiet; then
    kuning "    ada perubahan lokal lain:"
    git diff --name-only | sed 's/^/      /'
    gagal "bereskan dulu — 'git checkout -- <berkas>' atau commit"
  fi

  git pull --ff-only || gagal "git pull ditolak; jalankan 'git pull --rebase' lalu ulangi"
  SESUDAH="$(git rev-parse HEAD)"

  if [[ "$SEBELUM" == "$SESUDAH" ]]; then
    echo "    tidak ada perubahan baru"
  else
    git --no-pager log --oneline "$SEBELUM..$SESUDAH" | sed 's/^/      /'
  fi
fi

# ---------------------------------------------------------------------
# 2. Paket
# ---------------------------------------------------------------------
# `npm ci` menolak bila package-lock.json tidak sejalan dengan package.json —
# dan itu justru yang diinginkan di server: yang terpasang harus persis sama
# dengan yang diuji, bukan versi terbaru yang kebetulan cocok.
if [[ ! -d node_modules ]] || git diff --name-only "$SEBELUM" "$SESUDAH" | grep -q '^package-lock\.json$'; then
  echo "==> Menyelaraskan paket"
  if ! npm ci --silent; then
    kuning "    npm ci gagal — membersihkan node_modules dan mengulang"
    rm -rf node_modules
    npm ci --silent || gagal "npm ci"
  fi
fi

# ---------------------------------------------------------------------
# 3. Bangun
# ---------------------------------------------------------------------
# dist/ TIDAK lagi ikut dikomit sejak commit "Stop tracking build output", jadi
# langkah ini bukan pelengkap — tanpa build, dist/ di server tidak pernah
# berubah dan deploy tidak melakukan apa pun.
echo "==> Membangun"
npm run build > /dev/null || gagal "tsc — perbaiki galat tipe sebelum deploy"

[[ -f "$AKAR/dist/server.js" ]] || gagal "hasil build tidak memuat dist/server.js"
[[ -f "$AKAR/dist/worker.js" ]] || gagal "hasil build tidak memuat dist/worker.js"

# ---------------------------------------------------------------------
# 4. Uji
# ---------------------------------------------------------------------
# Uji di sini berjalan tanpa MongoDB — seluruhnya memakai repository tiruan —
# jadi menjalankannya di server aman dan tidak menyentuh data.
if [[ $LEWATI_UJI -eq 0 && -d tests ]]; then
  echo "==> Menjalankan uji"
  npm test -- --silent > /dev/null || gagal "ada uji yang tidak lolos"
fi

if [[ $HANYA_PERIKSA -eq 1 ]]; then
  hijau "Pemeriksaan selesai; indeks dan layanan tidak disentuh."
  exit 0
fi

# ---------------------------------------------------------------------
# 5. Indeks basis data
# ---------------------------------------------------------------------
# Setara dengan migrasi pada proyek ber-SQL: createIndex() tidak melakukan
# apa-apa bila indeksnya sudah ada, jadi aman dipanggil setiap deploy.
#
# SEBELUM layanan dinyalakan ulang. Kode baru menyaring bulan dengan rentang
# tanggal — bentuk yang mengandalkan indeks. Menyalakannya lebih dulu berarti
# beberapa saat pertama seluruh laporan memindai koleksi penuh.
#
# Pembuatan pertama pada koleksi besar memakan waktu; sesudahnya seketika.
if [[ $LEWATI_INDEKS -eq 0 ]]; then
  if command -v mongosh > /dev/null 2>&1; then
    echo "==> Menyelaraskan indeks"
    mongosh "$BASIS_DATA" --quiet --file scripts/create-indexes.js > /dev/null ||
      gagal "gagal membuat indeks"
  else
    kuning "==> mongosh tidak ada — indeks dilewati"
    kuning "    jalankan sendiri: mongosh $BASIS_DATA --quiet --file scripts/create-indexes.js"
  fi
fi

# ---------------------------------------------------------------------
# 6. Kepemilikan berkas
# ---------------------------------------------------------------------
# Administrasi server ini lazim dikerjakan sebagai root. Akibatnya berkas hasil
# `git pull` dan `npm ci` menjadi milik root, sementara layanannya berjalan
# sebagai pengguna lain dan tidak dapat membaca `.env`.
#
# Gejalanya menyesatkan: layanan menyala lalu mati berulang tanpa satu pun
# pesan dari aplikasinya.
if [[ $EUID -eq 0 ]] && id "$PENGGUNA_LAYANAN" > /dev/null 2>&1; then
  echo "==> Mengembalikan kepemilikan ke $PENGGUNA_LAYANAN"
  chown -R "$PENGGUNA_LAYANAN:$PENGGUNA_LAYANAN" "$AKAR"
fi

# ---------------------------------------------------------------------
# 7. Nyalakan ulang
# ---------------------------------------------------------------------
# KEDUANYA, selalu. Worker memuat kode yang sama dengan API; menyalakan ulang
# API saja meninggalkan worker lama yang memproses antrean FIFO dengan aturan
# harga pokok versi sebelumnya — tanpa satu pun tanda di layar.
for layanan in "$LAYANAN_API" "$LAYANAN_WORKER"; do
  echo "==> Menyalakan ulang $layanan"
  sudo systemctl restart "$layanan"
done

# Beri waktu menyala sebelum diperiksa; tanpa jeda, statusnya masih
# "activating" dan pemeriksaan di bawah selalu lolos.
sleep 3

for layanan in "$LAYANAN_API" "$LAYANAN_WORKER"; do
  sudo systemctl is-active --quiet "$layanan" || {
    merah "$layanan tidak menyala. Tiga puluh baris log terakhir:"
    sudo journalctl -u "$layanan" -n 30 --no-pager
    exit 1
  }
done

# ---------------------------------------------------------------------
# 8. Uji hidup
# ---------------------------------------------------------------------
# Layanan yang "active" belum tentu melayani. Yang menentukan adalah ia
# menjawab permintaan.
#
# Tanpa `-f`: aplikasi ini tidak punya endpoint kesehatan, dan akar alamatnya
# memang menjawab 404. Yang diperiksa adalah ADANYA jawaban HTTP — kode 000
# berarti sambungannya sendiri gagal.
PORTA="$(grep -E '^PORT=' .env | tail -1 | cut -d= -f2 | tr -d '"' | tr -d '\r')"
PORTA="${PORTA:-5000}"

KODE="$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORTA}/" || echo 000)"
if [[ "$KODE" == "000" ]]; then
  merah "Layanan menyala tetapi tidak menjawab di porta ${PORTA}."
  sudo journalctl -u "$LAYANAN_API" -n 30 --no-pager
  exit 1
fi

hijau "API hidup di porta ${PORTA} (HTTP ${KODE})."
hijau "Selesai."
