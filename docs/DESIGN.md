# Sistem desain El-Gibbor Worship

Panduan singkat agar tampilan jendela operator tetap konsisten. Berlaku sejak Tahap 6.5.

## 1. Token tiga lapis

| Lapis | Isi | Tempat |
| --- | --- | --- |
| 1. Dasar (primitive) | Nilai mentah: palet warna batu hangat, skala jarak, huruf, sudut, bayangan | Warna: `PALETTE` di `src/renderer/operator/src/theme/tokens.ts`. Lainnya: bagian 1 di `styles.css` |
| 2. Makna (semantic) | Fungsi warna: `--bg`, `--surface`, `--surface-2`, `--border`, `--fg`, `--muted`, `--danger`, `--success`, `--warning`, `--primary` | `SEMANTIC` di `tokens.ts`, diterapkan per mode oleh `useAppearance` |
| 3. Komponen | `--btn-*`, `--field-*`, `--panel-*`, `--row-*`, `--control-h` | Bagian 3 di `styles.css` |

Aturan:

- Komponen hanya memakai token lapis 2 atau 3. Jangan menulis warna hex atau ukuran px langsung di aturan komponen.
- Pengecualian: area slide selalu hitam (`--slide-bg`, `--on-slide`), karena menampilkan apa yang dilihat jemaat.
- Warna primer dipilih pengguna. `tokens.ts` menyesuaikannya per mode agar garis tepi minimal 3:1 dan teks minimal 4,5:1 (WCAG). Ini dijaga oleh test di `tokens.test.ts`.

## 2. Ukuran yang ikut layar

- Ukuran huruf dasar `:root` tumbuh dengan lebar jendela: 15 px di laptop 1366 px, 17 px di 1920 px, maksimal 18 px.
- Semua jarak dan ukuran memakai `rem`, jadi seluruh tampilan ikut membesar di monitor lebar.
- Ukuran panel disimpan dalam px pada ukuran dasar 15 px, lalu diubah ke `rem` (`toRem` di `layout/useLayout.ts`).
- Di layar pendek (tinggi sampai 800 px), tombol dan jarak panel sedikit dirapatkan.

Skala jarak (dalam rem, 1 rem = 15 px di laptop): `--space-1` 0,25, `--space-2` 0,5, `--space-3` 0,75, `--space-4` 1, `--space-6` 1,5.

Skala huruf: `--text-2xs` (label panel), `--text-xs` (keterangan), `--text-sm` (isi daftar), `--text-md` (tombol dan isi utama), `--text-base` (judul item), `--text-lg` (judul dialog).

## 3. Tombol

| Varian | Dipakai untuk | Biasa | Disorot | Nonaktif |
| --- | --- | --- | --- | --- |
| `.btn` | Aksi biasa | `--surface-2` | `--surface-hover`, tepi lebih tegas | 45% |
| `.btn-primary` | Satu aksi utama per area (Live, Simpan, + Lagu baru) | `--primary` | Lebih terang | 45% |
| `.btn-ghost` | Ikon di bilah atas | Transparan | `--surface-hover` | 45% |
| `.btn-danger` | Hapus | Teks merah | Latar merah tipis | 45% |
| `.btn-attention` | Simpan saat ada perubahan | Tepi dan teks primer | Seperti `.btn` | 45% |
| `.btn-active` | Tombol yang sedang aktif (Black, Clear, Logo, pilihan tersegmen) | `--primary` | Lebih terang | — |

Ukuran: `.btn` (tinggi `--control-h`), `.btn-sm` (tinggi `--control-h-sm`), `.icon-only` (persegi, wajib punya `title` dan teks `sr-only`).

Fokus keyboard selalu terlihat (`--focus-ring`), karena operator sering memakai Tab dan panah.

## 4. Tata letak panel

- Preview dan Live memakai pola yang sama (`.deck`). Urutannya: judul dan tombol di atas, slide besar di tengah, daftar slide di bawah dengan scroll sendiri.
- Slide besar memakai sekitar 60% tinggi panel dan selalu 16:9 (container query). Dengan begitu daftar slide tetap terlihat di laptop dan slide tidak terlalu besar di monitor lebar.
- Panel tidak di-scroll sebagai satu kesatuan. Yang di-scroll hanya daftar di dalamnya.
- Jenis item Schedule punya ikon dan warna sendiri: lagu (primer), Alkitab (biru), media (hijau), teks (ungu).

## 5. Cara memeriksa perubahan tampilan

Sebelum membuka PR yang mengubah tampilan, ambil tangkapan layar di 1366×768, 1920×1080, dan 2560×1080, dalam mode gelap dan terang. Periksa Preview/Live, setiap tab Pustaka, dan dialog.
