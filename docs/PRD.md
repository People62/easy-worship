# PRD El-Gibbor Worship

Tanggal: 2026-11-06

## 1. Ringkasan dan catatan legal

Aplikasi desktop offline untuk menampilkan lirik lagu, ayat Alkitab, dan media ke proyektor saat ibadah. Cara kerjanya terinspirasi EasyWorship 2009, tetapi kode, nama, dan tampilannya dibuat sendiri. Nama aplikasi: **El-Gibbor Worship**, untuk jemaat GPdI El-Gibbor.

**Identitas visual**

- Ikon aplikasi: monogram **"EG"** di dalam perisai, warna emas (desain B "Emas Perisai").
- Warna primer default emas `#D4A017`, bisa diganti pengguna (lihat F-UI).
- Logo GPdI tidak dipakai sebagai ikon atau merek aplikasi. Logo GPdI disimpan sebagai gambar "Logo Gereja" di Pengaturan, lalu ditampilkan ke proyektor lewat tombol Logo atau sebagai watermark. Gambarnya bisa diganti kapan saja.

Membuat aplikasi dengan *fungsi* serupa itu umumnya boleh. Hak cipta melindungi kode, gambar, dan teks, bukan ide atau cara kerja. Yang perlu dihindari:

| Hal | Boleh? | Catatan |
| --- | --- | --- |
| Fitur serupa (database lagu, schedule, Preview/Live, layar kedua) | Ya | Ide dan alur kerja tidak dilindungi hak cipta |
| Menyalin kode, file program, atau hasil bongkar (decompile) EasyWorship | Tidak | Melanggar hak cipta dan lisensi |
| Memakai nama "EasyWorship", logo, atau ikonnya | Tidak | Merek dagang milik pihak lain |
| Menyalin persis gambar, latar, atau tema bawaan EasyWorship | Tidak | Pakai aset sendiri atau berlisensi bebas |
| Tata letak umum (panel kiri, Preview, Live) | Ya | Gambar ulang dengan gaya sendiri, jangan meniru piksel demi piksel |
| Membaca file database lagu EasyWorship milik sendiri untuk dipindahkan | Umumnya ya | Untuk keperluan pindah data milik sendiri |

Isi juga punya hak cipta sendiri, terpisah dari aplikasinya:

- **Lirik lagu:** banyak lagu rohani dilindungi hak cipta. Gereja biasanya memakai lisensi seperti CCLI untuk menampilkannya.
- **Terjemahan Alkitab:** misalnya Terjemahan Baru (LAI) dilindungi hak cipta. Terjemahan domain publik seperti KJV atau Alkitab Terjemahan Lama bisa dibundel; terjemahan lain diimpor sendiri oleh pengguna.

Untuk penggunaan pribadi atau internal gereja risikonya kecil. Jika nanti mau dijual atau disebarkan, konsultasikan dengan ahli hukum. Bagian ini bukan nasihat hukum.

## 2. Tujuan dan pengguna

Satu operator harus bisa menjalankan seluruh ibadah dari satu laptop, tanpa internet, tanpa salah tampil di proyektor.

**Tujuan**

- Menampilkan lirik, ayat, dan media ke layar kedua dengan satu klik atau satu tombol keyboard.
- Menyiapkan urutan ibadah (schedule) sebelum hari-H, lalu menjalankannya dengan lancar.
- Mencari lagu atau ayat dalam hitungan detik saat ibadah berjalan.
- Berjalan di laptop biasa (RAM 4 GB) dan sepenuhnya offline.

**Bukan tujuan (untuk versi awal)**

- Streaming langsung ke YouTube atau Facebook.
- Kontrol dari HP atau jaringan.
- Sinkronisasi cloud atau akun pengguna.
- Editor video atau editor slide lengkap seperti PowerPoint.

**Pengguna**

| Peran | Kebutuhan utama | Kondisi saat bekerja |
| --- | --- | --- |
| Operator multimedia | Pindah slide cepat, tidak salah tampil, cari lagu kilat | Ibadah sedang berjalan, tekanan tinggi, ruangan gelap |
| Penyusun ibadah / worship leader | Menyusun schedule dan urutan bait lagu | Beberapa hari sebelum ibadah, santai |
| Admin data lagu | Mengetik, mengimpor, dan merapikan database lagu | Sesekali, butuh impor massal |

Untuk penggunaan pribadi, ketiga peran ini kemungkinan orang yang sama. Aplikasi cukup punya satu pengguna tanpa login.

## 3. Kebutuhan fungsional

Ada tujuh modul. Prioritas P0 = wajib di MVP, P1 = versi 1.0, P2 = nanti.

### 3.1 Lagu

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-LG-01 | Tambah, ubah, hapus lagu: judul, pengarang, hak cipta, nomor CCLI, kata kunci | P0 |
| F-LG-02 | Lirik dibagi per bagian (Verse 1, Chorus, Bridge, Ending) dengan penanda seperti `[Verse 1]` | P0 |
| F-LG-03 | Pencarian cepat berdasarkan judul dan isi lirik, hasil muncul saat mengetik (< 200 ms untuk 5.000 lagu) | P0 |
| F-LG-04 | Urutan tampil per lagu (misalnya V1, C, V2, C, B, C) yang bisa diatur ulang | P1 |
| F-LG-05 | Impor dari teks polos (.txt), OpenLyrics (.xml), dan CSV | P1 |
| F-LG-06 | Impor dari database EasyWorship 2009 milik sendiri (file `Songs.DB` + file pendampingnya di folder `Databases\Data`); lagu yang sudah ada dilewati atau ditanya. Boleh mengadaptasi logika importer OpenLP (sama-sama GPL) dengan mencantumkan sumbernya (lihat GIT-WORKFLOW.md bagian 8) | P1 |
| F-LG-09 | Opsi tampil huruf kapital per tema; lirik tetap disimpan dengan huruf aslinya | P0 |
| F-LG-07 | Tema khusus per lagu yang menimpa tema default | P1 |
| F-LG-08 | Pemecahan slide otomatis bila satu bagian terlalu panjang (batas baris bisa diatur) | P1 |

### 3.2 Alkitab

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-AL-01 | Ketik referensi singkat seperti `yoh 3:16-18` atau `mzm 23` dan langsung tampil | P0 |
| F-AL-02 | Nama kitab dalam bahasa Indonesia dan Inggris, termasuk singkatan umum | P0 |
| F-AL-03 | Impor terjemahan dari format terbuka (misalnya Zefania XML, OSIS, atau SQLite). TB (LAI) tidak dibundel; pengguna mengimpor file TB miliknya sendiri | P0 |
| F-AL-04 | Pencarian kata di seluruh Alkitab | P1 |
| F-AL-05 | Tampilkan dua terjemahan berdampingan | P2 |
| F-AL-06 | Ayat panjang dipecah otomatis menjadi beberapa slide | P0 |

### 3.3 Media

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-MD-01 | Pustaka gambar (JPG, PNG) dan video (MP4, WebM) dengan thumbnail | P0 |
| F-MD-02 | Gambar atau video sebagai latar belakang lirik; video latar diputar berulang tanpa suara | P0 |
| F-MD-03 | Putar video sebagai item sendiri, dengan suara, play/pause, dan seek | P1 |
| F-MD-04 | Impor PowerPoint atau PDF sebagai gambar per slide | P2 |

### 3.4 Schedule (urutan ibadah)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-SC-01 | Tambahkan lagu, ayat, media, dan slide teks bebas ke schedule dengan drag-and-drop | P0 |
| F-SC-02 | Ubah urutan, hapus, dan duplikat item | P0 |
| F-SC-03 | Simpan dan buka schedule sebagai satu file (ekstensi `.egw`) | P0 |
| F-SC-04 | Ekspor schedule ke satu paket yang berisi media, untuk dipindah ke komputer lain | P2 |
| F-SC-05 | Slide teks bebas untuk pengumuman, dengan judul dan isi | P0 |

### 3.5 Preview dan Live

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-PL-01 | Panel Preview menampilkan semua slide item terpilih sebagai thumbnail | P0 |
| F-PL-02 | Kirim item ke Live dengan klik ganda, tombol, atau Enter | P0 |
| F-PL-03 | Panel Live menampilkan persis apa yang ada di proyektor | P0 |
| F-PL-04 | Pindah slide dengan panah, Page Up/Down, spasi, dan klik (cocok dengan clicker presentasi) | P0 |
| F-PL-05 | Lompat ke bagian lagu dengan huruf: V1, C, B (misalnya tekan `C` untuk Chorus) | P1 |
| F-PL-06 | Transisi fade antar slide, durasi bisa diatur (default 300 ms) | P1 |

### 3.6 Output layar

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-OT-01 | Jendela output layar penuh di monitor atau proyektor yang dipilih | P0 |
| F-OT-02 | Deteksi monitor otomatis; bila proyektor dicabut, output tidak muncul di layar operator | P0 |
| F-OT-03 | Mode jendela untuk uji coba tanpa proyektor | P0 |
| F-OT-04 | Output kedua untuk layar panggung (stage display): slide sekarang, slide berikut, jam | P2 |
| F-OT-05 | Resolusi output default 1920×1080 (16:9) | P0 |

### 3.7 Kontrol cepat dan tema

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-KC-01 | Tombol Black (layar hitam), Clear (hapus teks, latar tetap), Logo (gambar Logo Gereja dari Pengaturan, default logo GPdI) | P0 |
| F-KC-02 | Semua kontrol cepat punya pintasan keyboard (default F5, F6, F7; lihat tabel pintasan) | P0 |
| F-TM-01 | Editor tema: font, ukuran, warna, bayangan/outline teks, perataan, margin, latar | P0 |
| F-TM-02 | Tema default terpisah untuk lagu, Alkitab, dan teks bebas | P1 |
| F-TM-03 | Ukuran teks menyesuaikan otomatis agar muat di layar | P1 |
| F-TM-04 | Rasio layar 16:9 dan 4:3 | P0 |

### 3.8 Tampilan aplikasi operator

Ini mengatur tampilan jendela operator, bukan tampilan di TV jemaat (itu diatur lewat Tema).

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-UI-01 | Mode gelap dan terang, plus opsi "ikuti Windows" | P0 |
| F-UI-02 | Ganti mode cepat dari bilah atas (satu klik), tanpa restart | P0 |
| F-UI-03 | Warna primer bisa dipilih: 8 warna siap pakai + pemilih warna bebas (hex) | P0 |
| F-UI-04 | Warna teks di atas warna primer otomatis hitam atau putih agar tetap terbaca | P0 |
| F-UI-05 | Tombol "Kembalikan ke default" (emas, mode gelap) | P0 |
| F-UI-06 | Pilihan mode dan warna disimpan dan dipakai lagi saat aplikasi dibuka | P0 |

## 4. Kebutuhan non-fungsional

Yang paling penting adalah stabilitas saat live: layar proyektor tidak boleh berkedip, macet, atau menampilkan jendela lain.

| ID | Area | Kebutuhan |
| --- | --- | --- |
| NF-01 | Platform | Windows 10/11 wajib; Linux dan macOS diharapkan berjalan |
| NF-02 | Offline | Semua fitur berjalan tanpa internet |
| NF-03 | Performa | Pindah slide < 100 ms; aplikasi terbuka < 5 detik; video latar 1080p berjalan mulus di 30 fps |
| NF-04 | Kapasitas | Lancar dengan 5.000 lagu, 5 terjemahan Alkitab, dan 1.000 file media |
| NF-05 | Stabilitas | Jendela output terpisah dari jendela operator; error di satu panel tidak membuat output mati |
| NF-06 | Keamanan data | Simpan otomatis; backup database harian otomatis (simpan 7 terakhir); ekspor/impor backup manual |
| NF-07 | Pemulihan | Bila aplikasi tertutup mendadak, buka kembali schedule dan slide terakhir |
| NF-08 | Kemudahan | Operator baru bisa menjalankan ibadah setelah 15 menit belajar |
| NF-09 | Tampilan operator | Mode gelap sebagai default; mode terang untuk ruangan terang. Kontras teks minimal 4.5:1 di kedua mode |
| NF-10 | Bahasa | Antarmuka bahasa Indonesia, bisa ditambah bahasa Inggris |
| NF-11 | Instalasi | Satu file installer, ukuran < 200 MB |

## 5. Perangkat di gereja

| Hal | Kondisi |
| --- | --- |
| Laptop operator | Windows 10, RAM 4 GB |
| Rasio layar | 16:9 |
| Sambungan | Laptop → HDMI → 1 monitor pemantau di samping + 3 TV untuk jemaat |

Dengan satu kabel HDMI, laptop hanya melihat **satu layar luar**. Jika monitor pemantau dan ketiga TV menampilkan gambar yang sama (lewat HDMI splitter), aplikasi cukup punya satu jendela output di layar HDMI itu. Panel Live di laptop juga menampilkan gambar yang sama.

Dampak RAM 4 GB: target pemakaian memori aplikasi < 600 MB, video latar maksimal 1080p, thumbnail dibuat kecil dan disimpan (cache).

## 6. Tata letak dan alur kerja

Semua dikerjakan di jendela operator; proyektor hanya menerima isi panel Live. Ukuran panel bisa digeser, dan susunannya diingat.

```
+--------------------------------------------------------------------+
| Jendela operator (layar laptop)                                    |
| +----------------------------------------------------------------+ |
| |  Bilah atas: Black · Clear · Logo · Tema · Pengaturan          | |
| +----------------------------------------------------------------+ |
| +--------------+ +-------------------+       +-------------------+ |
| | Schedule     | | Preview           | Enter | Live              | |
| | Urutan       | | Slide item        | ----> | Sama persis       |------+
| | ibadah: lagu,| | terpilih, belum   |       | dengan proyektor  | |    |
| | ayat, media  | | terlihat jemaat   |       |                   | |    |
| +--------------+ +-------------------+       +-------------------+ |    |
| +----------------------------------------------------------------+ |    |
| | Pustaka: Lagu · Alkitab · Media · Tema                         | |    |
| | Kolom cari; klik = buka di Preview, seret = masuk Schedule     | |    |
| +----------------------------------------------------------------+ |    |
+--------------------------------------------------------------------+    |
                                                                          | tampil
                                               +-------------------------+ | layar
                                               | Proyektor / layar kedua |<+ penuh
                                               +-------------------------+
```

**Alur kerja operator**

1. Sebelum ibadah: buka atau buat schedule, cari lagu dan ayat di Pustaka, lalu seret ke Schedule.
2. Atur urutan bait tiap lagu dan pilih tema bila perlu.
3. Sambungkan proyektor, pilih monitor output di Pengaturan, lalu cek tampilan dengan tombol Logo.
4. Saat ibadah: pilih item di Schedule, item terbuka di Preview, tekan Enter untuk mengirim ke Live.
5. Pindah slide dengan panah atau clicker. Tekan huruf bagian (misalnya `C`) untuk lompat ke Chorus.
6. Permintaan mendadak: ketik referensi ayat atau judul lagu di kolom cari, lalu langsung kirim ke Live tanpa masuk Schedule.
7. Antar sesi: Black atau Logo, agar layar tidak menampilkan sisa slide.

**Pintasan keyboard bawaan**

| Tombol | Aksi |
| --- | --- |
| Panah kanan / Page Down / Spasi | Slide berikutnya |
| Panah kiri / Page Up | Slide sebelumnya |
| Enter | Kirim Preview ke Live |
| Ctrl+F | Fokus ke kolom cari |
| F5 / F6 / F7 | Black / Clear / Logo |
| 1–9, C, B, E | Lompat ke Verse 1–9, Chorus, Bridge, Ending |
| Esc | Keluar dari Black, Clear, atau Logo |

## 7. Model data dan teknologi

Rekomendasi: **Electron + React + TypeScript + SQLite**. Electron membawa Chromium sendiri, jadi video dan font tampil sama di Windows, Linux, dan macOS, dan dua jendela (operator dan output) mudah dibuat.

**Model data utama** (satu file SQLite, media disimpan sebagai file di folder pustaka)

| Entitas | Kolom penting | Catatan |
| --- | --- | --- |
| Song | id, judul, pengarang, hak_cipta, ccli, kata_kunci, urutan_tampil, tema_id | Indeks pencarian teks penuh (FTS5) atas judul dan lirik |
| SongSection | id, song_id, jenis (verse/chorus/bridge/ending), nomor, teks | Satu lagu punya banyak bagian |
| BibleVersion | id, nama, singkatan, bahasa, lisensi | Satu baris per terjemahan yang diimpor |
| BibleVerse | version_id, kitab, pasal, ayat, teks | Indeks (version_id, kitab, pasal, ayat) dan FTS5 |
| Media | id, jenis (gambar/video), path, durasi, thumbnail | File asli tidak disalin ke database |
| Theme | id, nama, font, ukuran, warna, outline, bayangan, perataan, margin, latar | Disimpan sebagai JSON |
| Schedule | id, nama, tanggal, path_file | File schedule berformat JSON |
| ScheduleItem | schedule_id, posisi, jenis, ref_id, override_tema, urutan_bait | Merujuk ke Song, ayat, Media, atau teks bebas |

**Susunan teknis**

| Bagian | Pilihan | Alasan |
| --- | --- | --- |
| Kerangka desktop | Electron | Dua jendela, deteksi monitor (`screen` API), video konsisten |
| Antarmuka | React + TypeScript + Vite | Komponen panel, cepat dikembangkan |
| Warna dan mode | CSS variables (`--primary`, `--bg`, dll.) | Ganti mode atau warna primer cukup mengubah variabel, tanpa reload |
| Database | SQLite (better-sqlite3) | Offline, satu file, mudah di-backup |
| Render slide | HTML/CSS di jendela output | Satu komponen yang sama dipakai untuk thumbnail, Preview, Live, dan output |
| Video | Elemen `<video>` HTML5 | MP4 (H.264) dan WebM didukung Chromium |
| Komunikasi | IPC Electron: jendela operator mengirim status Live ke jendela output | Output tetap jalan walau panel operator error |
| Paket installer | electron-builder | Installer Windows (.exe), AppImage untuk Linux |

Alternatif yang lebih ringan adalah Tauri (installer jauh lebih kecil), tetapi pemutaran video di Linux bergantung pada WebKitGTK dan sering bermasalah. Untuk aplikasi yang berat di video, Electron lebih aman.

## 8. Rencana rilis, risiko, dan pertanyaan terbuka

Setiap tahap baru dimulai setelah gerbangnya lulus. MVP sudah cukup untuk dipakai di ibadah sungguhan.

| Tahap | Isi | Gerbang untuk lanjut |
| --- | --- | --- |
| MVP (P0) | Lagu + cari cepat; Alkitab: ketik referensi; Schedule, Preview, Live; output layar kedua; Black/Clear/Logo, tema dasar | 1 ibadah penuh tanpa error |
| Versi 1.0 (P1) | Urutan bait, lompat bagian; impor lagu (EasyWorship 2009, txt, OpenLyrics); video sebagai item; transisi fade, auto-fit teks; cari kata di Alkitab | 4 ibadah berturut-turut lancar |
| Lanjutan (P2) | PowerPoint / PDF; stage display; dua terjemahan berdampingan; paket schedule + media | — |

**Kriteria sukses**

- Satu ibadah 90 menit dijalankan tanpa aplikasi macet atau salah tampil.
- Lagu atau ayat permintaan mendadak tampil dalam < 10 detik.
- Operator tidak perlu menyentuh PowerPoint atau aplikasi lain selama ibadah.

**Risiko**

| Risiko | Dampak | Cara mengatasi |
| --- | --- | --- |
| Output muncul di layar yang salah saat proyektor dicolok/dicabut | Jemaat melihat desktop operator | Uji F-OT-02 di laptop dan proyektor gereja sejak awal |
| Video latar patah-patah di laptop lama | Tampilan tidak nyaman | Batasi ke 1080p, sediakan opsi matikan video latar |
| Data lagu hilang | Kerja mengetik ratusan lagu hilang | Backup otomatis harian (NF-06) |
| Terjemahan Alkitab berhak cipta tidak bisa dibundel | Harus impor sendiri | Bundel terjemahan domain publik, dokumentasikan cara impor |

**Pertanyaan terbuka**

- [ ] Apakah folder `Databases\Data` berisi `Songs.DB` ada di laptop gereja? (cek di `C:\Users\Public\Documents\Softouch\EasyWorship\`)
- [ ] Dari mana file TB yang sah didapat (izin LAI, atau file dari software berlisensi milik gereja)?
- [ ] Apakah monitor pemantau dan 3 TV memakai HDMI splitter (gambar sama), atau ada output terpisah?
- [ ] Perlu stage display untuk pemimpin pujian di MVP, atau cukup nanti?
