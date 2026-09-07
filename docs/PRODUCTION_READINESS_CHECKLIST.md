# Production Readiness Checklist — JAGGAD Academy

Audit terakhir: **7 September 2026**

Status repository: **CONDITIONAL GO**

Status menerima transaksi production: **NO-GO sampai seluruh item P0 manual selesai**

Kode, build, migrasi SQLite, dan regression test sudah lolos. Status masih NO-GO untuk trafik nyata karena credential, MySQL production, DNS/TLS, webhook publik, SMTP, backup offsite, dan pengujian provider hanya dapat diverifikasi pada infrastruktur pemilik.

## 1. Bukti audit otomatis

| Pemeriksaan | Hasil audit |
|---|---|
| PHPUnit | 70 test, 349 assertion — lulus |
| Unit test JavaScript | 3 test — lulus |
| Install frontend bersih | `npm ci` — lulus |
| Build Vite production | lulus, 3.428 module ditransformasi |
| Dependency tree | `npm ls --depth=0` — bersih |
| Audit npm | 0 vulnerability pada audit cache saat audit |
| Composer | `composer validate --strict` — lulus |
| Audit Composer | tidak ada advisory pada lock file |
| Platform Composer | PHP 8.3 dan extension lokal memenuhi requirement production |
| Migrasi + seeder | lulus pada database SQLite production-like kosong |
| Constraint slug | unique index produk dan kategori terpasang |
| Cache Laravel | config, event, route, dan view cache berhasil |
| Smoke test HTTP | `/up`, `/`, dan paket valid mengembalikan HTTP 200 |
| Backup/restore | database SQLite dan `storage/app` berhasil dibuat dan diverifikasi |
| Syntax | PHP dan Bash file yang berubah valid |
| Route aplikasi | route cache berhasil; route publik bawaan `/storage/{path}` tidak aktif |
| Secret scan repository | tidak ditemukan credential production yang ter-track |

Catatan batas audit:

- MySQL belum dapat diuji lokal karena Docker daemon/MySQL tidak tersedia. Migrasi **wajib** diuji pada clone/snapshot MySQL staging sebelum production.
- Audit tidak dapat membuktikan keberhasilan Midtrans, SMTP, Google OAuth, Meta CAPI, DNS, TLS, cron, firewall, atau restore offsite tanpa credential dan server nyata.
- Audit UI lintas browser, mobile nyata, accessibility manual, serta load test belum dilakukan.

## 2. Perbaikan aplikasi yang sudah diterapkan

### Dependency dan runtime

- [x] PHP dinaikkan ke `^8.3` agar dependency Laravel/Symfony yang didukung dan ter-patch dapat dipasang.
- [x] Composer lock diperbarui dan lolos security audit.
- [x] Node dibatasi ke `^20.19.0 || >=22.12.0`; Node 22 LTS direkomendasikan.
- [x] `engine-strict=true` mencegah install dengan runtime Node yang tidak kompatibel.
- [x] Timeout SMTP dan HTTP provider eksternal dibatasi agar request tidak menggantung tanpa batas.

### Checkout, pembayaran, dan akses produk

- [x] Harga dan produk checkout selalu diselesaikan ulang dari database/config server; nominal browser tidak dipercaya.
- [x] Paket hanya dapat dibeli jika semua produk anggotanya tersedia; harga/nama tampilan berasal dari server.
- [x] Pembuatan transaksi, item, dan payment manual berjalan dalam satu database transaction.
- [x] Metode pembayaran nonaktif ditolak walau request dibuat langsung.
- [x] Bukti transfer manual wajib di backend, maksimal 5 MB dan dimensi 8.000 × 8.000.
- [x] Kegagalan pembuatan Snap token tidak ditampilkan sebagai sukses dan tidak membersihkan keranjang.
- [x] Verifikasi browser hanya boleh untuk pemilik/admin, transaksi Midtrans, `order_id` dan nominal yang cocok.
- [x] Status kartu `capture` hanya sukses jika `fraud_status=accept`; `deny` menjadi gagal.
- [x] Signature dan nominal webhook diverifikasi; signature tidak disimpan dalam payload database.
- [x] Finalisasi dipusatkan di `TransactionFinalizer`, memakai row lock dan idempotent.
- [x] Transaksi sukses tidak dapat diturunkan kembali oleh webhook terlambat.
- [x] Akses produk, `sold_count`, `purchase_count`, dan `total_spent` hanya bertambah satu kali.
- [x] Kegagalan email/Meta tidak menggagalkan hak akses customer.
- [x] Meta Pixel dan CAPI memakai `event_id` transaction code yang sama untuk deduplikasi.
- [x] Checkout, upload bukti, verifikasi, login/register, dan reset password memiliki rate limit.

### Privasi dan otorisasi

- [x] Bukti pembayaran disimpan pada disk privat dan hanya dilayani melalui route terautentikasi.
- [x] Hanya pemilik transaksi atau admin yang dapat melihat bukti pembayaran.
- [x] Nginx dan Apache menolak akses langsung ke `/storage/payments` untuk instalasi lama.
- [x] Link materi tidak dikirim pada endpoint produk publik; hanya pemilik produk yang mendapatkannya.
- [x] URL materi dibatasi ke HTTP/HTTPS dan struktur data admin divalidasi.
- [x] Upload SVG baru untuk logo/favicon ditolak untuk menghindari stored XSS.
- [x] User inactive dikeluarkan saat request berikutnya dan ditolak pada password/Google login.
- [x] Non-admin pada route admin mendapat HTTP 403.
- [x] CSRF hanya dikecualikan untuk path webhook Midtrans yang tepat.
- [x] Secret CMS tidak diserialisasi kembali ke browser dan nilai lama dipertahankan saat field secret kosong.
- [x] User dengan histori transaksi dan akun admin tidak dapat menghapus diri melalui profile.
- [x] Admin terakhir, master data berhistori, dan transaksi final dilindungi dari operasi destruktif.

### Data, operasi, dan deployment

- [x] Status user dinormalisasi ke `active`/`inactive`.
- [x] Slug produk/kategori diperbaiki dan dilindungi unique index; perubahan judul tidak mengubah URL produk lama.
- [x] Script deploy memakai maintenance mode, install/build/test, migrasi, cache, queue restart, dan meninggalkan maintenance mode saat sukses.
- [x] Jika deploy gagal, aplikasi sengaja tetap maintenance agar release setengah jadi tidak menerima trafik.
- [x] Script backup mendukung MySQL/SQLite, memverifikasi output, menyertakan private storage, dan retention 30 hari.
- [x] Reset data admin membersihkan upload private/public terkait selain record database.
- [x] Konfigurasi mail Laravel 12 menggunakan `scheme` (`smtp`/`smtps`) yang benar.
- [x] HTTPS hanya dipaksa otomatis pada environment production.
- [x] Seeder production tidak membuat akun demo/default admin.

## 3. P0 — wajib selesai sebelum go-live

Semua checkbox berikut harus diisi manusia yang memegang server dan akun provider.

### 3.1 Server dan database

- [ ] Gunakan PHP 8.3+ dengan `bcmath`, `ctype`, `curl`, `dom/xml`, `fileinfo`, `gd`, `intl`, `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, dan `zip`.
- [ ] Gunakan Node 22 LTS dan npm 10+ pada build server, atau deploy asset yang telah dibangun CI.
- [ ] Arahkan document root Nginx/Apache tepat ke `<release>/public`, bukan root repository.
- [ ] Buat user MySQL khusus aplikasi dengan hak minimum; jangan memakai root.
- [ ] Jalankan seluruh migrasi pada clone/snapshot **MySQL staging** dan uji rollback/restore.
- [ ] Pastikan `storage` dan `bootstrap/cache` writable oleh user PHP-FPM, bukan world-writable.
- [ ] Pasang process manager untuk queue worker jika `QUEUE_CONNECTION=database` digunakan.
- [ ] Jalankan satu instance scheduler (`php artisan schedule:work`) atau cron `schedule:run` jika task terjadwal ditambah.

### 3.2 Environment production

Minimal:

```dotenv
APP_NAME="JAGGAD ACADEMY"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domain-anda.com
APP_TIMEZONE=Asia/Jakarta
APP_KEY=base64:...

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=jaggad
DB_USERNAME=jaggad_app
DB_PASSWORD=...

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_ENCRYPT=true
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=public

MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_SCHEME=smtp
MAIL_FROM_ADDRESS=noreply@domain-anda.com
MAIL_FROM_NAME="JAGGAD ACADEMY"
```

- [ ] Buat `APP_KEY` **sekali** untuk instalasi baru dan simpan di secret manager + backup terenkripsi.
- [ ] Jangan pernah menjalankan `key:generate` lagi pada instalasi aktif; mengganti key memutus session/data terenkripsi.
- [ ] Pastikan `.env`, dump database, backup, dan log tidak berada di document root atau artifact publik.
- [ ] Pastikan clock server sinkron NTP; timestamp pembayaran dan signature bergantung pada waktu yang benar.

Kredensial Midtrans, Google, Meta, dan SMTP dapat diisi dari Admin → Settings dan akan meng-override fallback `.env`. Karena secret tersebut tersimpan di database, batasi akses database/backup dan enkripsi backup offsite.

### 3.3 TLS dan web server

- [ ] Pasang sertifikat TLS valid dan redirect HTTP → HTTPS.
- [ ] Terapkan lalu sesuaikan `docs/nginx-jaggad.conf.example` atau aturan Apache ekuivalen.
- [ ] Pastikan HSTS `includeSubDomains` hanya diaktifkan jika seluruh subdomain sudah HTTPS.
- [ ] Batasi firewall ke 80/443 serta SSH dari sumber yang diperlukan.
- [ ] Set PHP `upload_max_filesize`/`post_max_size` dan web server sedikit di atas batas aplikasi 5 MB.
- [ ] Dari jaringan publik, pastikan `/.env`, `/vendor`, `/storage/payments/*`, backup, dan source map tidak dapat diunduh.
- [ ] Pastikan `/up` merespons 200 melalui load balancer tanpa mengekspos detail internal.

### 3.4 Admin dan konten

- [ ] Buat admin pertama secara aman melalui mekanisme server internal; jangan memakai password default/seeder demo.
- [ ] Aktifkan MFA pada panel hosting, email, Google Cloud, Meta, Midtrans, dan database provider. Aplikasi admin sendiri belum memiliki MFA.
- [ ] Ganti seluruh data sandbox/demo: produk, rekening, nomor kontak, domain, logo, link materi, dan copy legal.
- [ ] Jangan menjalankan `InitialDataSeeder` pada production tanpa review: seeder tidak membuat user production, tetapi tetap membuat kategori, 6 produk contoh, dan 3 metode pembayaran.
- [ ] Pastikan setiap produk berbayar memiliki link materi yang benar dan hanya dapat dibuka oleh pembeli.
- [ ] Pastikan paket yang ditawarkan di `config/packages.php` berisi produk aktif; perubahan paket masih membutuhkan deploy.

### 3.5 Midtrans

- [ ] Isi Server Key/Client Key sandbox, mode production `false`, lalu bersihkan config cache.
- [ ] Daftarkan Notification URL `https://domain-anda.com/midtrans/webhook`.
- [ ] Daftarkan Finish URL `https://domain-anda.com/dashboard` dan Error URL `https://domain-anda.com/checkout`.
- [ ] Uji Snap: pending, settlement, capture accept, capture deny, cancel, deny, expire, browser ditutup sebelum callback, dan webhook duplikat.
- [ ] Cocokkan transaksi, nominal, akses produk, statistik, email, dan event Meta setelah setiap skenario.
- [ ] Ganti ke credential live + mode production `true`, bersihkan cache, lalu lakukan pembelian live nominal kecil.
- [ ] Pastikan Notification URL hanya HTTPS publik dan balasan webhook stabil 2xx.

### 3.6 Email

- [ ] Konfigurasikan SMTP production dan uji timeout/error log.
- [ ] Uji receipt pembelian, resend receipt admin, penolakan pembayaran, dan reset password.
- [ ] Uji ke minimal Gmail dan satu provider lain; cek spam.
- [ ] Pasang SPF, DKIM, dan DMARC untuk domain pengirim.

### 3.7 Google OAuth dan Meta

- [ ] Google: tambahkan callback persis `https://domain-anda.com/auth/google/callback`, consent screen production, domain terverifikasi, dan akun support resmi.
- [ ] Google: uji akun baru, akun email yang sudah ada, akun aplikasi inactive, cancel, dan callback gagal.
- [ ] Meta: isi Pixel ID dan CAPI token production; gunakan Test Events untuk `PageView`, `ViewContent`, `InitiateCheckout`, dan `Purchase`.
- [ ] Meta: pastikan Purchase browser/server ter-deduplicate dengan event ID yang sama dan nilai/currency benar.
- [ ] Batasi/rotasi token provider dan dokumentasikan pemilik serta tanggal rotasinya.

### 3.8 Backup, monitoring, dan recovery

- [ ] Set `BACKUP_DIR` ke storage terpisah dan jadwalkan `scripts/backup.sh` harian.
- [ ] Salin backup secara terenkripsi ke akun/provider lain; backup pada server aplikasi bukan disaster recovery.
- [ ] Lakukan restore nyata database + `storage/app`, termasuk satu bukti transfer privat.
- [ ] Tetapkan RPO/RTO, retention harian/mingguan/bulanan, pemilik restore, dan prosedur insiden.
- [ ] Pasang alert untuk HTTP 5xx, `/up`, queue gagal, disk, CPU/RAM, database, sertifikat TLS, dan kegagalan backup.
- [ ] Aktifkan log rotation dan pastikan payload sensitif/token tidak masuk log.
- [ ] Jika instalasi lama pernah menyimpan bukti di `storage/app/public/payments`, pindahkan file tersebut ke `storage/app/private/payments` setelah backup dan verifikasi record.

### 3.9 Bisnis dan kepatuhan

- [ ] Publikasikan syarat layanan, kebijakan privasi, refund/cancel, informasi badan usaha, dan kanal bantuan yang benar.
- [ ] Tetapkan SOP refund/chargeback, sengketa bukti transfer, salah nominal, dan customer kehilangan akses.
- [ ] Verifikasi izin penggunaan logo, testimonial, aset, font, dan materi pembelajaran.
- [ ] Lakukan acceptance test owner pada desktop/mobile nyata dan accessibility keyboard dasar.

## 4. Deployment runbook

### Sebelum deploy

```bash
php artisan about
composer audit --locked --no-interaction
npm audit --audit-level=high
scripts/backup.sh
```

- [ ] Catat commit/tag release dan hasil CI.
- [ ] Pastikan backup terbaru dapat dibaca.
- [ ] Beri tahu operator tentang maintenance window.

### Deploy

```bash
./scripts/deploy.sh
```

Script menjalankan maintenance mode, install dependency, build, test, install Composer tanpa dev dependency, migrasi, storage link, cache production, dan queue restart. Jika command gagal, cari penyebab sebelum menjalankan `php artisan up`.

Untuk first install saja, buat `.env` dan `APP_KEY` sebelum script. Script sengaja tidak menjalankan seeder.

### Verifikasi setelah deploy

```bash
php artisan about
php artisan migrate:status
php artisan queue:failed
curl -fsS https://domain-anda.com/up
```

- [ ] `APP_ENV=production`, debug OFF, URL dan timezone benar.
- [ ] Login customer/admin, katalog, detail produk, checkout, upload bukti, dan logout bekerja.
- [ ] Route bukti menolak guest/customer lain dan menerima pemilik/admin.
- [ ] Jalankan satu transaksi end-to-end sesuai metode aktif.
- [ ] Cek log aplikasi, PHP-FPM, Nginx, queue, SMTP, Midtrans, dan Meta.

## 5. Rollback

1. Pertahankan maintenance mode.
2. Kembalikan artifact/release ke commit sebelumnya.
3. Restore database hanya bila migrasi tidak backward-compatible dan restore telah diputuskan operator.
4. Restore `storage/app` bila file ikut berubah/hilang.
5. Jalankan install/cache untuk release lama, smoke test, lalu `php artisan up`.
6. Dokumentasikan transaksi yang masuk di sekitar insiden agar tidak diproses dua kali.

Jangan mengandalkan `migrate:rollback` otomatis pada production tanpa meninjau migration dan data yang sudah ditulis versi baru.

## 6. Batasan produk yang diterima atau perlu keputusan owner

Ini bukan regression blocker jika memang di luar scope peluncuran, tetapi harus disepakati:

- Paket dikelola lewat config/deploy, belum ada CRUD paket admin.
- Email verification sengaja nonaktif.
- Admin aplikasi belum memiliki MFA dan audit log aktivitas lengkap.
- Belum ada workflow refund/chargeback otomatis.
- Belum ada kuota/seat khusus webinar atau kelas offline.
- Belum ada coupon, pajak, invoice fiskal, atau rekonsiliasi settlement otomatis.
- Email receipt dan Meta CAPI dipanggil sinkron setelah commit, tetapi sudah diberi timeout dan failure tidak membatalkan akses.
- Secret integrasi CMS tersimpan di database, bukan application-level encrypted column.
- Belum ada Content-Security-Policy ketat; header keamanan dasar sudah aktif.
- Kontak publik masih perlu diverifikasi sebagai kanal operasional yang benar.

Jika salah satu kemampuan di atas wajib untuk model bisnis/legal saat launch, ubah menjadi P0 dan jangan go-live sebelum tersedia.

## 7. Sign-off

| Peran | Pernyataan | Nama/tanggal |
|---|---|---|
| Developer | Commit yang diuji sama dengan release | [ ] |
| Infra | Runtime, TLS, permissions, worker, cron, monitoring siap | [ ] |
| Database | Migrasi MySQL staging dan restore test lulus | [ ] |
| Business owner | Produk, harga, paket, rekening, materi, legal disetujui | [ ] |
| Payment owner | Sandbox matrix dan satu live payment lulus | [ ] |
| Marketing | Pixel/CAPI dan consent/privacy disetujui | [ ] |
| Support | SOP refund, dispute, dan recovery akses siap | [ ] |

Keputusan akhir hanya **GO** bila seluruh P0 dan sign-off terisi. Hingga saat itu, repository layak dijadikan release candidate tetapi belum boleh menerima transaksi production.
