# Rencana Pengerjaan El-Gibbor Worship

Tanggal: 2026-11-06 · Acuan: [PRD.md](./PRD.md)

MVP dikerjakan dalam 8 tahap. Bagian yang paling berisiko (jendela output di layar HDMI) dikerjakan paling awal, supaya masalah di laptop gereja ketahuan sejak dini.

Ukuran tiap tahap: **K** = kecil, **S** = sedang, **B** = besar.

## 1. Arsitektur singkat

```
                 ┌──────────────────────────────────────────┐
                 │  Main process (Node.js / Electron)        │
                 │  - Database SQLite (lagu, Alkitab, dll.)  │
                 │  - Deteksi monitor, buka jendela          │
                 │  - Status Live (slide yang sedang tampil) │
                 │  - Backup, simpan otomatis                │
                 └───────────────┬──────────────────────────┘
                     IPC (pesan) │            │ IPC
              ┌──────────────────┘            └──────────────────┐
┌─────────────▼──────────────┐                ┌──────────────────▼───────┐
│ Jendela operator (React)   │                │ Jendela output (React)   │
│ Schedule · Preview · Live  │                │ Layar penuh di HDMI      │
│ Pustaka · Pengaturan       │                │ Hanya SlideRenderer      │
└────────────────────────────┘                └──────────────────────────┘
```

- Satu komponen **SlideRenderer** dipakai di thumbnail, Preview, Live, dan jendela output. Apa yang terlihat di Live pasti sama dengan di TV.
- Status Live disimpan di main process. Jika jendela operator error, TV tetap menampilkan slide terakhir.
- Jendela React tidak mengakses database langsung, tetapi lewat fungsi IPC yang diberi tipe TypeScript.

## 2. Struktur folder

```
easy-worship/
├─ docs/                 PRD, rencana, catatan
├─ src/
│  ├─ main/              Electron main process
│  │  ├─ db/             skema, migrasi, query
│  │  ├─ importers/      EasyWorship 2009, Zefania/OSIS, OpenLyrics, txt
│  │  ├─ windows/        jendela operator & output, deteksi monitor
│  │  ├─ live/           status Live, Black/Clear/Logo
│  │  └─ ipc/            daftar fungsi IPC
│  ├─ preload/           jembatan aman main ↔ React
│  ├─ shared/            tipe & logika bersama (parser referensi, pemecah slide)
│  └─ renderer/
│     ├─ operator/       aplikasi React jendela operator
│     ├─ output/         aplikasi React jendela output
│     └─ components/     SlideRenderer, tombol, panel, dll.
├─ resources/            ikon EG, font, latar bawaan
└─ tests/                unit test (Vitest)
```

## 3. Tahap pengerjaan MVP

### Tahap 0 · Persiapan proyek (K)

- [x] Buat proyek dengan **electron-vite** (React + TypeScript).
- [x] Pasang ESLint, Prettier, dan Vitest.
- [x] Pasang `better-sqlite3`, pastikan bisa di-build untuk Electron.
- [x] Coba buat installer Windows (`electron-builder`) sejak awal.

**Selesai bila:** installer kosong bisa dipasang dan dibuka di Windows 10.

**Hasil (2026-11-06):** lulus. Installer dari CI terpasang di Windows; aplikasi menampilkan v0.0.0, Electron 45.2.3, dan SQLite 3.53.4.

### Tahap 1 · Fondasi (S)

- [x] Skema database + sistem migrasi (tabel dari PRD bagian 7).
- [x] Lapisan IPC bertipe dalam satu kontrak (`src/shared/ipc.ts`). Tahap 1 berisi `app`, `settings`, dan `displays`; `songs`, `bible`, `live`, dan lainnya ditambahkan di tahapnya masing-masing.
- [x] Penyimpanan pengaturan (mode, warna primer, monitor output).
- [x] Sistem tampilan: CSS variables, mode gelap/terang, warna primer (F-UI-01 s.d. 06).
- [x] Kerangka layar operator: bilah atas, Schedule, Preview, Live, Pustaka (masih kosong).

Catatan: ukuran panel yang bisa digeser dan diingat (PRD bagian 6) dipindah ke Tahap 6, bersama alur Schedule dan Live.

**Selesai bila:** layar operator terbuka, mode dan warna bisa diganti lalu diingat.

### Tahap 2 · Mesin tampilan dan output (B) — paling berisiko

- [x] Komponen **SlideRenderer**: teks, latar warna, huruf kapital, rasio 16:9, 1920×1080. Latar gambar/video menyusul di Tahap 5.
- [x] Jendela output layar penuh di monitor yang dipilih.
- [x] Deteksi monitor dicolok/dicabut (F-OT-02); output tidak pernah muncul di layar laptop.
- [x] Mode jendela untuk uji tanpa proyektor (F-OT-03).
- [x] Status Live di main process + tombol Black, Clear, Logo (logo GPdI dari Pengaturan).

**Selesai bila:** di laptop gereja, slide uji tampil di 3 TV, dan cabut-colok HDMI tidak membuat output pindah ke layar laptop.

Cabut-colok HDMI sudah diuji dengan test otomatis (`src/main/output/manager.test.ts`). Uji di gereja tetap diperlukan:

- [ ] Sambungkan HDMI. Status di kanan atas berubah menjadi "Output: … 1920×1080".
- [ ] Ketik slide uji, tekan Enter: teks tampil di monitor pemantau dan ketiga TV.
- [ ] F5 (Black), F6 (Clear), F7 (Logo), lalu Esc: TV mengikuti, dan layar laptop tetap menampilkan aplikasi.
- [ ] Cabut HDMI saat slide tampil: slide tidak muncul di layar laptop; status menjadi "tidak ada layar HDMI".
- [ ] Colok lagi: slide kembali tampil di TV tanpa perlu menekan apa pun.
- [ ] Pilih logo GPdI di Pengaturan, tekan F7: logo tampil di TV.

### Tahap 3 · Lagu (B)

- [x] Tambah/ubah/hapus lagu dan metadatanya.
- [x] Editor lirik dengan penanda `[Verse 1]`, `[Chorus]`, dst., termasuk istilah Indonesia: `[Bait 1]`, `[Reff]`, `[Pre Reff]`, `[Penutup]`.
- [x] Pencarian cepat judul + lirik + kata kunci (SQLite FTS5); test 5.000 lagu di bawah 200 ms.
- [x] Pemecah slide otomatis (batas baris, bisa diatur 1–12 di Pengaturan) + unit test.

**Selesai bila:** lagu bisa diketik, dicari, dan tampil per slide di Preview.

Catatan: pindah slide di Live dengan satu tombol (tanpa Enter tiap slide) dikerjakan di Tahap 6 bersama alur Schedule dan Live.

### Tahap 4 · Alkitab (S)

- [x] Importer Zefania XML, OSIS (termasuk ayat model milestone), dan OpenSong.
- [x] Parser referensi: `yoh 3:16-18`, `mzm 23`, `1 kor 13:4`, `kej 1:31-2:3`, `yoh 3:16, 18` (nama Indonesia + Inggris) + unit test.
- [x] Pemecah ayat panjang menjadi beberapa slide (di akhir kalimat atau koma).

**Selesai bila:** file TB milik sendiri berhasil diimpor dan `yoh 3:16` langsung tampil.

Sudah diuji dengan contoh KJV (domain publik). Uji dengan file TB menunggu file yang sah.

**Cara mendapatkan file Alkitab**

| Format | Ciri file | Contoh sumber |
| --- | --- | --- |
| Zefania XML | Berawal `<XMLBIBLE>` | Modul Zefania (banyak terjemahan, termasuk domain publik) |
| OSIS | Berawal `<osis>` | Proyek CrossWire/SWORD, eBible.org |
| OpenSong | Berawal `<bible>` dengan `<b>`, `<c>`, `<v>` | Kumpulan Alkitab OpenSong |

Terjemahan Baru (TB) milik LAI dan berhak cipta. Untuk pemakaian gereja, gunakan file dari sumber yang sah atau minta izin LAI. File Alkitab tidak boleh di-commit ke repo (lihat GIT-WORKFLOW.md bagian 5).

### Tahap 5 · Media dan tema (S)

- [x] Pustaka gambar dan video + thumbnail (disimpan, 320×180 JPEG). File disalin ke folder aplikasi. Video di atas 1080p diberi peringatan.
- [x] Video latar berulang tanpa suara. Hanya jendela TV yang memutar video; Preview, Live, dan thumbnail memakai gambar diam agar hemat memori.
- [x] Editor tema: font, ukuran, jarak baris, warna, garis tepi, bayangan, perataan, margin, latar (warna/gambar/video), peredup latar, huruf kapital. Tema default terpisah untuk Lagu, Alkitab, dan Teks.

**Selesai bila:** lirik tampil di atas video latar dengan lancar di laptop RAM 4 GB.

Sudah diuji di Linux dengan video WEBM 640×360. Uji kelancaran di laptop gereja (RAM 4 GB, video 1080p) masih diperlukan.

Belum termasuk (P1): tema khusus per lagu (F-LG-07) dan video sebagai item dengan suara (F-MD-03).

### Tahap 6 · Schedule dan alur Live (S)

- [ ] Tambah item ke Schedule dengan drag-and-drop; ubah urutan, hapus, duplikat.
- [ ] Slide teks bebas untuk pengumuman.
- [ ] Simpan dan buka file `.egw`.
- [ ] Preview → Live dengan Enter; pindah slide dengan panah, Page Up/Down, spasi, clicker.
- [ ] Semua pintasan keyboard dari PRD.
- [ ] Ukuran panel bisa digeser dan diingat (dipindah dari Tahap 1).

**Selesai bila:** satu urutan ibadah lengkap bisa disusun dan dijalankan hanya dengan keyboard.

### Tahap 6.5 · Perbaikan desain (S)

Disepakati 2026-11-06: fungsi dulu, desain belakangan. Tahap ini memoles semua layar setelah semuanya berfungsi, memakai skill `design-system` (token, skala huruf dan jarak, spesifikasi komponen).

**Catatan desain yang sudah ditemukan**

- Di layar lebar (sekitar 2000 px), Preview dan Live terlalu besar sehingga banyak ruang kosong di bawahnya.
- Panel Schedule lebar tetapi isinya sedikit.
- Ukuran huruf terasa kecil dibanding luas layar.
- Di layar 1366×768, daftar slide di Preview harus di-scroll karena slide besar memakan tempat. Pertimbangkan Preview yang lebih kecil atau thumbnail di samping.
- Tab Tema di Pustaka terasa sempit di layar 1366×768: kartu tema terpotong dan perlu di-scroll.

**Selesai bila:** semua layar rapi dan konsisten di layar laptop 1366×768 dan di layar lebar.

### Tahap 7 · Stabil dan rilis MVP (S)

- [ ] Simpan otomatis + backup harian (simpan 7 terakhir).
- [ ] Pemulihan setelah aplikasi tertutup mendadak.
- [ ] Ukur memori (< 600 MB) dan kecepatan pindah slide (< 100 ms).
- [ ] Installer final dengan ikon EG.
- [ ] Gladi bersih di gereja dengan daftar cek (lihat bagian 5).

**Gerbang MVP:** 1 ibadah penuh berjalan tanpa error.

## 4. Setelah MVP (Versi 1.0)

| Urutan | Fitur | Ukuran |
| --- | --- | --- |
| 1 | Impor database EasyWorship 2009 (`Songs.DB`) | B |
| 2 | Urutan bait per lagu + lompat bagian (`C`, `B`, `1`–`9`) | S |
| 3 | Impor OpenLyrics dan teks polos | K |
| 4 | Video sebagai item (dengan suara, play/pause) | S |
| 5 | Transisi fade + ukuran teks otomatis | S |
| 6 | Pencarian kata di Alkitab | K |

**Gerbang Versi 1.0:** 4 ibadah berturut-turut lancar.

Catatan: jika di laptop gereja ternyata ada `Songs.DB`, impor EasyWorship bisa dipindah ke antara Tahap 3 dan 4 supaya tidak perlu mengetik ulang lagu.

## 5. Cara menguji

| Jenis | Apa yang diuji | Kapan |
| --- | --- | --- |
| Unit test (Vitest, dijalankan di dalam Electron agar modul SQLite bisa dipakai) | Database, pengaturan, warna, parser referensi Alkitab, pemecah slide, importer | Setiap perubahan |
| Uji manual di laptop sendiri | Alur operator, mode jendela output | Akhir tiap tahap |
| Uji di laptop gereja | HDMI + 3 TV, RAM 4 GB, video latar | Akhir Tahap 2, 5, dan 7 |
| Gladi bersih | Ibadah simulasi 90 menit dengan daftar cek | Tahap 7 |

**Daftar cek gladi bersih**

- [ ] Output muncul di TV, bukan di layar laptop.
- [ ] Cabut-colok HDMI tidak mengacaukan tampilan.
- [ ] Lagu permintaan mendadak tampil < 10 detik.
- [ ] Ayat permintaan mendadak tampil < 10 detik.
- [ ] Black, Clear, Logo berfungsi dari keyboard.
- [ ] Video latar lancar selama 90 menit, memori tetap < 600 MB.
- [ ] Aplikasi ditutup paksa lalu dibuka lagi: schedule dan slide terakhir kembali.

## 6. Cara kita bekerja

1. Satu tahap = satu branch Git dan satu pull request.
2. Di akhir tiap tahap saya tunjukkan hasilnya (screenshot atau cara mencoba), lalu Anda cek sebelum lanjut.
3. Bagian Electron (main process, IPC, jendela) saya kerjakan dan jelaskan; bagian React bisa Anda ikut kerjakan.
4. Hal yang belum pasti dicatat di bagian "Pertanyaan terbuka" PRD.
