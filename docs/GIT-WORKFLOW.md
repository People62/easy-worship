# Alur Git, CI, dan Rilis

Tanggal: 2026-11-06 · Repo: [People62/easy-worship](https://github.com/People62/easy-worship) (publik)

Ringkasnya: `main` selalu dalam keadaan bisa dirilis. Setiap tahap dikerjakan di branch sendiri dengan banyak commit kecil. Setiap push menjalankan CI, setiap tahap masuk ke `main` lewat pull request, dan rilis dibuat dengan tag versi.

## 1. Branch

```
main ─────●───────────────●───────────────●──────── tag v1.0.0
           \             / \             /
            ●──●──●──●──●   ●──●──●──●──●
            phase-0-setup       phase-1-foundation  ...
```

| Branch | Isi | Aturan |
| --- | --- | --- |
| `main` | Kode yang sudah lulus review dan CI | Tidak boleh push langsung; hanya lewat PR |
| `phase-N-name` | Satu tahap dari PLAN.md, misalnya `phase-2-output` | Dibuat dari `main` terbaru |
| `fix/short-name` | Perbaikan bug setelah rilis, misalnya `fix/bible-parser-spacing` | Dibuat dari `main`, PR kecil |

- **Satu tahap = satu branch = satu PR.** Tahap besar (Tahap 2 dan 3) boleh dipecah jadi 2 PR, misalnya `phase-3a-song-editor` dan `phase-3b-song-search`, agar review tidak terlalu panjang.
- **Merge memakai "Create a merge commit"**, bukan squash. Commit kecil di dalam branch tetap tersimpan di riwayat, dan batas tiap tahap terlihat jelas.
- Setelah di-merge, branch tahap dihapus.

**Nama branch per tahap**

| Tahap (PLAN.md) | Branch |
| --- | --- |
| 0 · Persiapan proyek | `phase-0-setup` |
| 1 · Fondasi | `phase-1-foundation` |
| 2 · Mesin tampilan dan output | `phase-2-output` |
| 3 · Lagu | `phase-3-songs` |
| 4 · Alkitab | `phase-4-bible` |
| 5 · Media dan tema | `phase-5-media-themes` |
| 6 · Schedule dan alur Live | `phase-6-schedule-live` |
| 7 · Stabil dan rilis MVP | `phase-7-release` |

## 2. Commit

Satu commit = satu perubahan yang utuh dan bisa dijelaskan dalam satu kalimat. **Nama branch dan pesan commit memakai bahasa Inggris**, dengan format **Conventional Commits** (ringkasan huruf kecil, kalimat perintah, tanpa titik di akhir):

```
<type>(<scope>): <short summary>
```

| Type | Dipakai untuk | Contoh |
| --- | --- | --- |
| `feat` | Fitur baru | `feat(output): open fullscreen window on HDMI display` |
| `fix` | Perbaikan bug | `fix(bible): accept "1kor" without a space` |
| `test` | Menambah/mengubah test | `test(slides): cover lyrics longer than 4 lines` |
| `refactor` | Ubah struktur tanpa ubah perilaku | `refactor(ipc): unify live message types` |
| `docs` | Dokumentasi | `docs: update phase 2 plan` |
| `chore` | Konfigurasi, dependensi | `chore: add better-sqlite3` |
| `ci` | Workflow GitHub Actions | `ci: add windows build job` |

Scope yang dipakai: `songs`, `bible`, `media`, `theme`, `schedule`, `live`, `output`, `render`, `slides`, `db`, `ipc`, `ui`, `import`, `settings`.

Contoh isi branch `phase-2-output`:

```
feat(render): add base SlideRenderer at 1920x1080
feat(output): open fullscreen output on selected display
feat(output): handle display connect and disconnect
test(output): pick display when screen list changes
feat(live): keep live state in main process
feat(live): add black, clear, and logo controls
docs: add church laptop test results
```

## 3. CI: berjalan di setiap push

File: `.github/workflows/ci.yml`. Berjalan saat **push ke branch mana pun** dan saat **pull request ke `main`**.

| Job | Runner | Langkah | Gagal bila |
| --- | --- | --- | --- |
| `check` | ubuntu-latest | `npm ci` → `lint` → `typecheck` → `test` (Vitest) | Ada error lint, error tipe, atau test gagal |
| `build-windows` | windows-latest | `npm ci` → `build` → `electron-builder --dir` (tanpa installer) | Aplikasi tidak bisa di-build di Windows, misalnya modul SQLite gagal |

- Kedua job berjalan bersamaan. Target waktu < 10 menit.
- Push baru ke branch yang sama membatalkan CI lama yang masih berjalan (`concurrency`).
- Cache `npm` dan `electron` agar CI cepat.
- Repo publik, jadi menit GitHub Actions gratis tanpa batas.

**Aturan proteksi `main`** (diatur di GitHub → Settings → Branches):

- [ ] Wajib lewat pull request.
- [ ] Wajib lulus `check` dan `build-windows`.
- [ ] Branch harus up to date dengan `main` sebelum merge.

## 4. Rilis

File: `.github/workflows/release.yml`. Berjalan saat **tag `v*`** di-push ke `main`.

1. Build installer Windows (`.exe`, NSIS) di windows-latest.
2. Buat **GitHub Release** berstatus draft, lampirkan installer, dan isi catatan rilis otomatis dari daftar PR.
3. Anda cek draft-nya, lalu klik Publish.

**Versi (SemVer)**

| Versi | Kapan | Jenis rilis |
| --- | --- | --- |
| `v0.1.0` … `v0.7.0` | Opsional, setelah tahap tertentu untuk dicoba di gereja (misalnya akhir Tahap 2 dan 5) | Pre-release |
| `v0.9.0` | Siap gladi bersih (akhir Tahap 7) | Pre-release |
| `v1.0.0` | Lulus gerbang MVP: 1 ibadah penuh tanpa error | Rilis production pertama |
| `v1.1.0`, `v1.2.0` … | Fitur "Versi 1.0" di PRD (impor EasyWorship, video item, dll.) | Rilis biasa |
| `v1.0.1` … | Perbaikan bug saja | Patch |

Catatan: dengan skema ini, fitur yang di PRD disebut "Versi 1.0" akan rilis sebagai `v1.1` dan seterusnya, karena `v1.0.0` sudah dipakai untuk MVP.

**Cara membuat rilis**

```
git checkout main && git pull
npm version 1.0.0          # ubah package.json + buat tag v1.0.0
git push --follow-tags     # memicu release.yml
```

**Tanda tangan installer:** tanpa sertifikat code signing (berbayar), Windows akan menampilkan peringatan SmartScreen saat instalasi. Untuk pemakaian sendiri cukup klik "More info → Run anyway". Sertifikat bisa ditambahkan nanti jika aplikasi dibagikan ke gereja lain.

## 5. Yang tidak boleh masuk repo

Repo ini **publik**, jadi semua isinya bisa dilihat orang lain.

| Jangan di-commit | Alasan |
| --- | --- |
| File Alkitab TB (LAI) | Berhak cipta |
| Database lagu (`Songs.DB`, hasil impor, file `.sqlite`) | Lirik berhak cipta |
| Logo GPdI | Milik organisasi; diatur lewat Pengaturan di komputer masing-masing |
| Video/gambar latar yang tidak berlisensi bebas | Hak cipta |
| Token, password, sertifikat | Keamanan |

Semua ini dicantumkan di `.gitignore`. Untuk test, pakai data contoh buatan sendiri di `tests/fixtures/` (misalnya lagu domain publik dan potongan ayat KJV).

## 6. Pengaturan default repo

Disetujui 2026-11-06.

| Hal | Isi |
| --- | --- |
| `.gitattributes` | Semua file teks memakai akhir baris LF |
| Versi Node | Node 24 LTS (`.nvmrc` + `engines`), package manager npm, `package-lock.json` di-commit |
| Hasil build per PR | CI menyimpan build Windows portable sebagai artifact selama 7 hari |
| Cek format commit | commitlint (Conventional Commits) dijalankan di CI |
| Template PR | Tujuan, cara mencoba, screenshot, checklist uji Windows |
| Template issue | "Laporan bug ibadah" dan "Permintaan fitur" |
| Milestone | Satu per tahap: Phase 0 – Phase 7 |
| Label | `phase-0` … `phase-7`, `bug`, `feature`, `church-test`, `dependencies` |
| Dependabot | npm dan GitHub Actions, seminggu sekali, dikelompokkan, tanpa merge otomatis |
| Keamanan Electron | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` |
| Proteksi `main` | Wajib lewat PR, wajib lulus CI, tanpa wajib approval (pengembang tunggal) |

## 7. Urutan penyiapan

1. Commit pertama di `main`: `docs/` + `.gitignore` + `README.md`.
2. Branch `phase-0-setup`: kerangka electron-vite + `ci.yml`.
3. PR pertama → CI lulus → merge.
4. Aktifkan proteksi `main` (setelah CI pernah berjalan, agar nama job-nya bisa dipilih).
5. `release.yml` ditambahkan di Tahap 7, sebelum `v0.9.0`.

## 8. Lisensi

**Keputusan (2026-11-06): GPL-3.0.** Teks resminya ada di file [`LICENSE`](../LICENSE), diambil dari gnu.org.

**Artinya**

- Tidak ada kode aktivasi atau *license key*. Installer berjalan seperti biasa.
- Siapa pun boleh memakai, mempelajari, mengubah, dan membagikan aplikasi ini secara gratis.
- Versi ubahan yang dibagikan wajib tetap GPL-3.0 dan kodenya wajib dibuka. Tidak ada yang bisa mengambil kode ini lalu menjualnya sebagai aplikasi tertutup.
- Hak cipta tetap milik People62 dan wajib dicantumkan.
- Aplikasi diberikan "apa adanya", tanpa garansi (bagian 15–16 GPL).

**Penerapan di repo**

- File `LICENSE` di root repo.
- `package.json`: `"license": "GPL-3.0-or-later"`.
- README: "© 2026 People62. Dibuat untuk GPdI El-Gibbor. Dilisensikan di bawah GPL-3.0."
- Menu "Tentang aplikasi" menampilkan versi, hak cipta, dan tautan ke teks lisensi.
- Installer Windows menampilkan halaman lisensi (cukup klik "Setuju"), sesuai kebiasaan aplikasi GPL.

**Dampak ke pengerjaan**

- Importer EasyWorship 2009 boleh mengadaptasi logika dari OpenLP (GPL). Setiap file yang mengambil dari OpenLP mencantumkan sumber dan hak cipta aslinya di bagian atas file. Ambil hanya dari versi OpenLP sejak 1 Mei 2019 (sudah GPL-3.0-or-later); versi lebih lama memakai lisensi GPL versi 2.
- Dependensi npm harus kompatibel dengan GPL-3.0: MIT, BSD, Apache-2.0, ISC, LGPL, dan GPL boleh.

**Yang tidak ikut berlisensi GPL**

- Lirik lagu, Alkitab TB, logo GPdI, dan media gereja. Semuanya tetap milik pemiliknya masing-masing dan tidak disimpan di repo (lihat bagian 5).
- Nama "El-Gibbor Worship" dan ikon EG. Orang lain boleh memakai kodenya, tetapi sebaiknya memakai nama dan ikon sendiri untuk versi mereka. Ini dicatat di README.
