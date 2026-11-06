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

- [ ] Komponen **SlideRenderer**: teks, latar gambar/warna, huruf kapital, rasio 16:9, 1920×1080.
- [ ] Jendela output layar penuh di monitor yang dipilih.
- [ ] Deteksi monitor dicolok/dicabut (F-OT-02); output tidak pernah muncul di layar laptop.
- [ ] Mode jendela untuk uji tanpa proyektor (F-OT-03).
- [ ] Status Live di main process + tombol Black, Clear, Logo (logo GPdI dari Pengaturan).

**Selesai bila:** di laptop gereja, slide uji tampil di 3 TV, dan cabut-colok HDMI tidak membuat output pindah ke layar laptop.

### Tahap 3 · Lagu (B)

- [ ] Tambah/ubah/hapus lagu dan metadatanya.
- [ ] Editor lirik dengan penanda `[Verse 1]`, `[Chorus]`, dst.
- [ ] Pencarian cepat judul + lirik (SQLite FTS5), target < 200 ms untuk 5.000 lagu.
- [ ] Pemecah slide otomatis (batas baris) + unit test.

**Selesai bila:** lagu bisa diketik, dicari, dan tampil per slide di Preview.

### Tahap 4 · Alkitab (S)

- [ ] Importer Zefania XML dan OSIS.
- [ ] Parser referensi: `yoh 3:16-18`, `mzm 23`, `1 kor 13:4` (nama Indonesia + Inggris) + unit test.
- [ ] Pemecah ayat panjang menjadi beberapa slide.

**Selesai bila:** file TB milik sendiri berhasil diimpor dan `yoh 3:16` langsung tampil.

### Tahap 5 · Media dan tema (S)

- [ ] Pustaka gambar dan video + thumbnail (disimpan, ukuran kecil).
- [ ] Video latar berulang tanpa suara, maksimal 1080p.
- [ ] Editor tema: font, ukuran, warna, outline/bayangan, perataan, margin, latar, huruf kapital.

**Selesai bila:** lirik tampil di atas video latar dengan lancar di laptop RAM 4 GB.

### Tahap 6 · Schedule dan alur Live (S)

- [ ] Tambah item ke Schedule dengan drag-and-drop; ubah urutan, hapus, duplikat.
- [ ] Slide teks bebas untuk pengumuman.
- [ ] Simpan dan buka file `.egw`.
- [ ] Preview → Live dengan Enter; pindah slide dengan panah, Page Up/Down, spasi, clicker.
- [ ] Semua pintasan keyboard dari PRD.
- [ ] Ukuran panel bisa digeser dan diingat (dipindah dari Tahap 1).

**Selesai bila:** satu urutan ibadah lengkap bisa disusun dan dijalankan hanya dengan keyboard.

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
