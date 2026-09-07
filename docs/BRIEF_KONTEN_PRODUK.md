# BRIEF KONTEN PRODUK — JAGGAD ACADEMY

> Dokumen ini untuk **pemateri/mentor**. Isi semua data yang diminta, lalu serahkan ke tim admin.
> Admin akan menginput data ini ke panel admin (Admin → Produk → Tambah Produk) tanpa perlu coding.
> **Lengkapi semua bagian yang bertanda WAJIB.** Data yang kurang akan menunda produk tayang di katalog.

---

## 0. Cara Kerja Singkat

1. Mentor mengisi template di bagian bawah dokumen ini (sesuai kategori produknya).
2. Tim admin menginput ke panel admin.
3. Setelah tayang: judul, harga, benefit, dan daftar materi otomatis muncul di katalog, halaman detail, halaman sales, dan dashboard pembeli.
4. **Link materi** yang kamu berikan adalah yang akan dibuka pembeli di dashboard mereka setelah bayar. Pastikan link aktif dan bisa diakses.

---

## 1. Data Wajib — Semua Kategori

| # | Field | Wajib? | Ketentuan | Contoh |
|---|---|---|---|---|
| 1 | **Judul Produk** | ✅ WAJIB | Maks. 255 karakter. Saran format: `{Kategori}: {Topik}` | `Video Kelas: Instagram Marketing Mastery` |
| 2 | **Kategori** | ✅ WAJIB | Pilih salah satu: `Ebook` / `Video Kelas` / `Webinar` / `Kelas Offline` | `Video Kelas` |
| 3 | **Harga Jual** | ✅ WAJIB | Angka rupiah, tulis tanpa titik/koma | `299000` |
| 4 | **Harga Normal** | Disarankan | Harga sebelum diskon. Otomatis membentuk harga coret + label "Hemat X%" | `599000` |
| 5 | **Deskripsi Singkat** | ✅ WAJIB | 1–2 kalimat. Tampil di kartu katalog & ringkasan produk | `Kuasai Instagram Marketing dari nol hingga mahir dengan 50+ video pembelajaran.` |
| 6 | **Deskripsi Lengkap** | ✅ WAJIB | 1–3 paragraf. Tampil di halaman detail & halaman sales | — |
| 7 | **Daftar Manfaat (Benefits)** | ✅ WAJIB | 5–8 poin, tiap poin satu kalimat singkat & konkret | `Akses seumur hidup ke semua materi` |
| 8 | **Daftar Materi** | ✅ WAJIB | Lihat detail di Bagian 3. Urutan daftar = urutan tampil & progres belajar pembeli | — |
| 9 | **Cover Produk (Gambar)** | ✅ WAJIB | Lihat ketentuan gambar di Bagian 2 | — |
| 10 | **Badge Label** | Opsional | Satu kata/frasa pendek. Tampil sebagai stiker pada kartu produk | `Bestseller`, `Terpopuler`, `Baru`, `Live`, `Premium` |
| 11 | **Jadwal Mulai–Selesai** | Opsional* | Tanggal + jam. *Wajib untuk Webinar & Kelas Offline* | `2026-10-15 19:00` s.d. `2026-10-15 22:00` |
| 12 | **Lokasi** | Opsional* | *Wajib untuk Webinar (`Via Zoom`) & Kelas Offline (alamat venue)* | `Jakarta Selatan` / `Via Zoom` |
| 13 | **Gambar Hero Sales** | Opsional | Gambar khusus halaman sales, beda dari cover. Ketentuan sama dengan cover | — |

> **Tidak perlu disiapkan mentor** (dikerjakan sistem/admin otomatis): slug URL, jumlah terjual, rating, status produk.
> Produk yang tampil di beranda (featured) dipilihkan oleh admin.

---

## 2. Ketentuan Gambar

| Gambar | Rasio & Ukuran | Format | Maks. Ukuran | Wajib? |
|---|---|---|---|---|
| **Cover produk** (tampil di katalog, detail, sales, dashboard) | **16:9**, disarankan min. **1280 × 720 px** | PNG / JPG / WebP | **2 MB** | ✅ WAJIB |
| **Gambar hero halaman sales** | 16:9, min. 1280 × 720 px | PNG / JPG / WebP | 5 MB | Opsional |
| **Gambar konten tambahan sales** (blok gambar/slider) | Bebas, lanskap lebih baik | PNG / JPG / WebP | 10 MB per gambar | Opsional (maks. 20 gambar per slider) |
| **Foto pemateri** (untuk promo/landing) | Persegi, min. 800 × 800 px | PNG / JPG | 2 MB | Opsional |
| **Mockup produk** (mis. mockup ebook 3D) | 16:9 atau 4:3 | PNG / JPG | 2 MB | Opsional |

**Tips cover yang bagus:** teks judul besar dan terbaca di ukuran kecil, kontras tinggi, hindari detail kecil, konsisten dengan warna brand (maroon `#660810`, putih).

Alternatif upload: boleh kirim **URL gambar** (mis. dari Unsplash/CDN) alih-alih file.

---

## 3. Ketentuan Materi & Link

Daftar materi adalah **produk yang sebenarnya** — inilah yang dibuka pembeli setelah membayar.

**Setiap item materi berisi 3 hal:**

| Bagian | Ketentuan | Contoh |
|---|---|---|
| **Judul** | Wajib. Nama bab/modul/sesi yang jelas | `Modul 2: Content Strategy` |
| **Durasi / Keterangan** | Wajib. Teks bebas — isi sesuai format kategori: `25 halaman` (ebook), `8 video` (video kelas), `60 menit` (webinar/offline) | `45 menit` |
| **Link** | Boleh dikosongkan dulu (muncul "Segera tersedia"), tapi **wajib diisi sebelum produk dijual** | `https://youtube.com/watch?v=...` |

**Jenis link yang didukung** (sistem otomatis menampilkan ikon sesuai jenisnya):

| Jenis Link | Contoh Platform | Ikon yang Muncul |
|---|---|---|
| Video | YouTube, Vimeo, Loom, Wistia | ▶️ Play |
| Dokumen | Google Docs, Notion, Medium, file PDF | 📄 File |
| Cloud/Drive | Google Drive, Dropbox, OneDrive | 📁 Folder |
| Meeting Live | Zoom, Google Meet, Microsoft Teams | 🖥️ Meeting |
| Desain/Template | Canva, Figma, Miro | 🎨 Desain |

**Aturan penting link:**
- Set izin **"Siapa saja yang memiliki link dapat melihat"** (khusus Google Drive/Docs).
- Test link dari akun/perangkat lain sebelum diserahkan.
- Jangan pakai link yang akan kedaluwarsa.
- 1 item materi = 1 unit progres pembeli (tombol "selesai" per item). Jumlah ideal **5–12 item** per produk — cukup granular, tidak terlalu pecah.

---

## 4. KATEGORI A — EBOOK

Selain data wajib di Bagian 1, siapkan:

- [ ] **Jumlah halaman total** (untuk copy promosi "X halaman")
- [ ] **Daftar BAB** (5–8 bab): judul bab + perkiraan halaman per bab
- [ ] **File final ebook**: PDF utuh, **atau** link Google Docs (akses "siapa saja dengan link")
- [ ] **Link baca per bab** (opsional): jika tiap bab dipisah, beri 1 link per bab; jika satu file utuh, beri 1 link yang sama/cukup 1 item materi
- [ ] **File pendukung** (opsional): checklist, template, worksheet — kirim sebagai link tambahan (Drive/PDF/Canva)
- [ ] **Mockup cover 3D** (opsional, untuk promo)

**Isi kolom "Durasi/Keterangan" tiap bab dengan jumlah halaman** → contoh: `Bab 1: Mindset Entrepreneur Digital` — `25 halaman`.

**Format penyerahan ebook yang disarankan:** satu folder Google Drive berisi `ebook-final.pdf` + folder `bonus/`, lalu bagikan link folder dengan akses publik-view.

### ✏️ TEMPLATE ISI — EBOOK

```
JUDUL PRODUK        :
KATEGORI            : Ebook
HARGA JUAL          : Rp
HARGA NORMAL        : Rp
BADGE (opsional)    :
DESKRIPSI SINGKAT   :
DESKRIPSI LENGKAP   :
TOTAL HALAMAN       :

MANFAAT (5–8 poin):
1.
2.
3.
4.
5.
6.

DAFTAR BAB (judul — halaman — link):
BAB 1 :                    —     hal —
BAB 2 :                    —     hal —
BAB 3 :                    —     hal —
BAB 4 :                    —     hal —
BAB 5 :                    —     hal —
BAB 6 :                    —     hal —

LINK FOLDER/FILE UTAMA :
GAMBAR COVER (lampiran/URL) :
```

---

## 5. KATEGORI B — VIDEO KELAS

Selain data wajib di Bagian 1, siapkan:

- [ ] **Daftar MODUL** (5–8 modul): judul modul + jumlah video per modul + durasi total modul
- [ ] **Link video per modul**, pilih salah satu skema:
  - **Skema 1 (disarankan):** 1 item materi = 1 modul = 1 link (video gabungan atau folder Drive berisi video modul tsb)
  - **Skema 2:** 1 item materi = 1 video (cocok jika video sedikit, ≤12)
- [ ] **Kualitas video:** min. 720p, ideal 1080p, audio jernih, format MP4
- [ ] **Total durasi kelas** (untuk copy promosi "total X jam")
- [ ] **File pendukung** (opsional): template, checklist, slide modul — link Drive/PDF/Canva
- [ ] **Platform hosting:** YouTube (Unlisted), Loom, Vimeo, atau Google Drive

**Isi kolom "Durasi/Keterangan" tiap modul dengan jumlah video atau durasi** → contoh: `Modul 3: Instagram Ads` — `12 video` atau `3 jam 20 menit`.

**Catatan YouTube Unlisted:** video unlisted tetap bisa diakses siapa pun yang punya link — aman untuk pembeli, tidak muncul di pencarian.

### ✏️ TEMPLATE ISI — VIDEO KELAS

```
JUDUL PRODUK        :
KATEGORI            : Video Kelas
HARGA JUAL          : Rp
HARGA NORMAL        : Rp
BADGE (opsional)    :
DESKRIPSI SINGKAT   :
DESKRIPSI LENGKAP   :
TOTAL DURASI        : (mis. 30 jam / 50+ video)

MANFAAT (5–8 poin):
1.
2.
3.
4.
5.
6.

DAFTAR MODUL (judul — jumlah video/durasi — link):
MODUL 1 :                    —            —
MODUL 2 :                    —            —
MODUL 3 :                    —            —
MODUL 4 :                    —            —
MODUL 5 :                    —            —
MODUL 6 :                    —            —

FILE PENDUKUNG (template/slide, opsional) :
GAMBAR COVER (lampiran/URL) :
```

---

## 6. KATEGORI C — WEBINAR

Selain data wajib di Bagian 1, siapkan:

- [ ] **Tanggal & jam pelaksanaan** (tanggal + jam mulai–selesai) — akan tampil di halaman produk
- [ ] **Platform**: Zoom / Google Meet / Microsoft Teams + **link meeting**
- [ ] **Rundown sesi** (3–6 sesi): judul sesi + durasi per sesi
- [ ] **Durasi total** (untuk copy "webinar 3 jam")
- [ ] **Materi presentasi**: PPT/PDF atau link — boleh menyusul setelah sesi
- [ ] **Link rekaman (recording)**: YouTube Unlisted / Drive — **wajib menyusul setelah webinar** agar pembeli bisa replay (tanpa ini, akses pembeli kosong setelah acara)
- [ ] **Bonus** (opsional): template, e-certificate kehadiran, grup komunitas
- [ ] **Kuota peserta** (jika terbatas — untuk teks urgensi di halaman sales)
- [ ] **Profil pemateri** (opsional untuk promo): nama, gelar/sertifikasi, foto persegi, bio 2–3 kalimat

**Isi kolom "Durasi/Keterangan" tiap sesi dengan durasinya** → contoh: `Sesi 2: Investasi untuk Freelancer` — `60 menit`.

> ⚠️ Link meeting **jangan ditaruh di materi publik** jika tidak ingin dibagikan luas — serahkan terpisah ke admin; admin bisa memasangnya mendekati hari-H atau membagikan via email ke pembeli.

### ✏️ TEMPLATE ISI — WEBINAR

```
JUDUL PRODUK        :
KATEGORI            : Webinar
HARGA JUAL          : Rp
HARGA NORMAL        : Rp
BADGE (opsional)    :
DESKRIPSI SINGKAT   :
DESKRIPSI LENGKAP   :
TANGGAL & JAM       :          s.d.
PLATFORM            : (Zoom / Meet / Teams)
DURASI TOTAL        :
KUOTA PESERTA       :

MANFAAT (5–8 poin):
1.
2.
3.
4.
5.

RUNDOWN SESI (judul — durasi — link, boleh kosong dulu):
SESI 1 :                    —      menit —
SESI 2 :                    —      menit —
SESI 3 :                    —      menit —

LINK MEETING (diserahkan terpisah ke admin) :
LINK SLIDE/PPT (boleh menyusul) :
LINK RECORDING (wajib menyusul setelah acara) :
PROFIL PEMATERI (nama, gelar, bio, foto) :
GAMBAR COVER (lampiran/URL) :
```

---

## 7. KATEGORI D — KELAS OFFLINE

Selain data wajib di Bagian 1, siapkan:

- [ ] **Tanggal mulai–selesai** (multi-hari: isi rentang lengkap) — akan tampil di halaman produk
- [ ] **Lokasi lengkap**: nama gedung/venue + alamat + kota (tampil dengan ikon peta)
- [ ] **Agenda per hari** (2–4 hari): judul tema hari + durasi per hari
- [ ] **Fasilitas** (untuk manfaat/benefit): makan siang, coffee break, materi cetak, sertifikat, dll.
- [ ] **Kuota peserta**
- [ ] **Persyaratan peserta** (untuk FAQ/deskripsi): mis. wajib bawa laptop
- [ ] **Info akses & parkir** (opsional, untuk FAQ)
- [ ] **Foto venue / dokumentasi kelas sebelumnya** (opsional, 3–10 foto untuk slider di halaman sales)
- [ ] **Materi sesi + rekaman** (jika ada): link Drive/PDF — menyusul setelah pelaksanaan

**Isi kolom "Durasi/Keterangan" tiap hari dengan durasinya** → contoh: `Hari 2: Hands-on Workshop` — `8 jam`.

### ✏️ TEMPLATE ISI — KELAS OFFLINE

```
JUDUL PRODUK        :
KATEGORI            : Kelas Offline
HARGA JUAL          : Rp
HARGA NORMAL        : Rp
BADGE (opsional)    :
DESKRIPSI SINGKAT   :
DESKRIPSI LENGKAP   :
TANGGAL MULAI       :
TANGGAL SELESAI     :
LOKASI LENGKAP      : (nama venue, alamat, kota)
KUOTA PESERTA       :
PERSYARATAN PESERTA :

MANFAAT / FASILITAS (5–8 poin):
1.
2.
3.
4.
5.
6.

AGENDA PER HARI (judul — durasi — link materi, boleh kosong dulu):
HARI 1 :                    —     jam —
HARI 2 :                    —     jam —
HARI 3 :                    —     jam —

FOTO VENUE/DOKUMENTASI (3–10 foto, opsional) :
GAMBAR COVER (lampiran/URL) :
```

---

## 8. Opsional — Copy Halaman Sales

Halaman sales (`/products/{slug}/sales`) otomatis memakai data produk di atas. Jika mentor/tim marketing ingin menyesuaikan, kirimkan juga:

- [ ] Judul khusus halaman sales & deskripsi penawaran
- [ ] 4–8 **manfaat utama** versi sales (boleh sama dengan benefits)
- [ ] **FAQ** 3–6 pasang pertanyaan–jawaban (keraguan calon pembeli: garansi? rekaman? grup? sertifikat?)
- [ ] **Teks kuota/urgensi** (mis. "Kuota hanya 30 peserta")
- [ ] Countdown penawaran (dalam jam)
- [ ] Teks tombol beli (default: "Beli sekarang")

Blok konten tambahan yang bisa diminta admin pasang di halaman sales: gambar, slider galeri, video YouTube (trailer kelas — sangat disarankan untuk video kelas & offline), tombol beli tambahan.

---

## 9. Checklist Akhir Sebelum Serah Terima

- [ ] Judul, harga, deskripsi, benefits terisi lengkap
- [ ] Cover gambar sesuai ketentuan (16:9, ≤2 MB)
- [ ] Daftar materi lengkap dengan judul + keterangan
- [ ] Semua link materi sudah ditest dari perangkat lain & izin akses "siapa saja dengan link"
- [ ] (Webinar/Offline) Tanggal, jam, dan lokasi terisi
- [ ] (Webinar) Recording disepakati kapan dikirim setelah acara
- [ ] Foto pemateri & bio disertakan jika ingin ditampilkan

**Serahkan ke:** Tim Admin JAGGAD Academy
**Pertanyaan:** hubungi admin via WhatsApp/kontak di halaman Kontak website.
