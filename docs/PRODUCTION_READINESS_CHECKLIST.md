# Production Readiness Checklist

Status audit saat ini: **NO-GO** → Aplikasi siap, menunggu infrastruktur dan verifikasi manual.

Dokumen ini adalah urutan kerja untuk menyiapkan JAGGAD Academy sebelum digunakan untuk transaksi production. Jangan lanjut ke tahap berikutnya sebelum acceptance criteria tahap sebelumnya terpenuhi.

**Centang ✅ = selesai, termasuk test otomatis.**
**Belum centang = butuh aksi (banyak di antaranya butuh bantuan Anda karena credential/akses).**

---

## A. Perbaikan Aplikasi

### 1. Perbaiki error page production ✅

- [x] `resources/css/errors.css` diimport dari `resources/css/app.css` (di atas `@tailwind`).
- [x] `error.blade.php` memakai `@vite('resources/css/app.css')`, bukan `errors.css` langsung.
- [x] Vite config hanya input `app.css` + `app.jsx` — manifest selalu punya entry ini.
- [x] URL acak menghasilkan HTTP `404`, akses ilegal menghasilkan HTTP `403`, exception server menghasilkan HTTP `500`.
- [x] Feature test `ErrorPagesTest` lolos di environment testing (condition: Vite manifest production-like).

Acceptance criteria:
- Halaman `403`, `404`, dan `500` dapat dirender tanpa exception tambahan.
- Response status tidak berubah menjadi `500` hanya karena stylesheet tidak ada di manifest.

### 2. Amankan webhook Midtrans ✅

Pada `app/Http/Controllers/MidtransWebhookController.php`:
- [x] Tolak request jika Midtrans Server Key kosong → `503`.
- [x] Gunakan `hash_equals()` untuk membandingkan signature → `403` jika palsu.
- [x] Validasi field wajib: `order_id`, `status_code`, `gross_amount`, `transaction_status`, dan `signature_key` → `422`.
- [x] Cocokkan `gross_amount` dari Midtrans dengan `total_amount` transaksi database → `422`.
- [x] Transaksi diambil dan dikunci dengan `lockForUpdate()` di dalam `TransactionFinalizer`.
- [x] Transaksi `success` tidak dapat turun status (cegah `pending`/`failed`/`expired`).
- [x] Webhook duplikat tidak menggandakan akses, omzet, atau `sold_count` (idempotensi).
- [x] `ProductionReadinessTest::test_midtrans_webhook_is_authenticated_amount_checked_and_idempotent` lolos.

Referensi resmi:
- [Midtrans HTTP(S) Notifications](https://docs.midtrans.com/docs/https-notification-webhooks)
- [Midtrans Notification Best Practices](https://docs.midtrans.com/reference/handle-notifications)

### 3. Satukan finalisasi transaksi ✅

`app/Services/TransactionFinalizer.php` menjadi satu-satunya jalur finalisasi untuk:
- [x] Approval admin manual
- [x] Webhook Midtrans
- [x] Verifikasi dari browser

Proses tersebut wajib:
- [x] Mengunci row transaksi (`lockForUpdate`)
- [x] Memastikan transaksi belum pernah sukses
- [x] Memperbarui status dan `paid_at`
- [x] Memberikan akses produk tepat satu kali (`syncWithoutDetaching`)
- [x] Menambah `sold_count`, `purchase_count`, dan `total_spent` tepat satu kali
- [x] Mengirim receipt email + Meta CAPI purchase event setelah database transaction berhasil
- [x] Mencatat kegagalan email/Meta tanpa membatalkan akses customer

### 4. Perbaiki perubahan metode Midtrans ✅

- [x] `resolveCart()` membuat transaksi/kode order baru ketika customer mengganti metode.
- [x] Snap token hanya dibuat dari transaksi yang benar-benar baru.
- [x] Order lama tetap `pending` dan tidak akan diproses lagi (bukan `expired`, lebih aman).

### 5. Lindungi data master dan histori ✅

- [x] Produk yang sudah pernah dibeli tidak dapat dihapus permanen → `AdminProductController::destroy` menolak dengan pesan error.
- [x] Rekening yang memiliki payment history tidak boleh dihapus → `AdminPaymentController::destroy` menolak.
- [x] Customer yang memiliki transaksi tidak boleh menghilangkan histori transaksi → `AdminUserController::destroy` menolak.
- [x] Admin tidak boleh menghapus atau menonaktifkan dirinya sendiri → `AdminUserController::update/toggleStatus/destroy` menolak.
- [x] Admin terakhir tidak boleh dihapus atau diturunkan menjadi customer → `AdminUserController::update/toggleStatus/destroy` menolak.
- [x] `ProductionReadinessTest::test_historical_master_data_cannot_be_deleted` + `test_last_active_admin_cannot_be_demoted_or_deactivated` + `test_admin_cannot_delete_themselves` lolos.

### 6. Perbaiki field nullable admin ✅

- [x] `AdminProductController::store/update`: semua field opsional memakai `?? null` (`category`, `originalPrice`, `badge`, `short_description`, `description`, `imageUrl`).
- [x] `AdminCategoryController::store/update`: `description` memakai `?? null`.
- [x] `ProductionReadinessTest::test_nullable_product_fields_do_not_cause_server_error` lolos.

### 7. Pindahkan paket bundling ke server-side ✅

- [x] Paket didefinisikan di `config/packages.php` (slug, nama, harga, daftar produk).
- [x] `CheckoutController::resolveCart` memperluas `package_slug` menjadi produk nyata dan menghitung harga dari config.
- [x] Harga final dihitung di backend; frontend hanya mengirim `package_slug`.
- [x] Slug paket yang tidak dikenal menghasilkan `404` (`abort_unless`).
- [x] Checkout memberikan akses ke seluruh produk dalam paket setelah pembayaran sukses.
- [x] `ProductionReadinessTest::test_package_checkout_uses_server_price_and_real_products` lolos.

> **Catatan**: Master paket admin (CRUD paket via UI) masih ditunda — paket dikelola sebagai config file. Bisa ditambahkan di tahap berikutnya.

### 8. Lengkapi materi dan progres pembelajaran ✅

- [x] Tabel `material_progress` dengan unique constraint (`user_id`, `product_id`, `material_index`).
- [x] Endpoint `POST /dashboard/learning/{product}/materials/{material}/complete` dengan pengecekan kepemilikan.
- [x] Materi tanpa link tidak dapat ditandai selesai (ditolak oleh controller).
- [x] Progres dihitung berdasarkan jumlah materi selesai dibanding total materi.
- [x] `ProductionReadinessTest::test_customer_can_complete_only_owned_available_material` lolos.

> **Catatan**: Materi seed default belum memiliki link — ini data, bukan kode. Admin harus menambahkan link materi melalui panel admin sebelum produk dipublikasikan.

### 9. Normalisasi status user ✅

- [x] Model menggunakan nilai `active` dan `inactive` secara konsisten.
- [x] Migration `2026_09_03_130000_normalize_user_statuses.php` mengubah data lama.
- [x] Login menolak user `inactive` (`LoginRequest::authenticate`).
- [x] `AdminUserController` menggunakan `normalizeStatus()` → tidak ada lagi nilai `Aktif`/`Nonaktif` di database.
- [x] `ProductionReadinessTest::test_inactive_user_is_rejected_at_login` lolos.

### 10. Verifikasi email — dinonaktifkan ✅

- [x] Email verification **tidak diaktifkan** sesuai permintaan (sebelumnya tidak ada).
- [x] `User` model tidak implement `MustVerifyEmail`.
- [x] Route memakai middleware `auth` saja (tanpa `verified`).
- [x] User baru bisa langsung login dan akses dashboard tanpa verifikasi email.

> **Catatan**: Jika ingin mengaktifkan verifikasi email di masa depan, tambahkan `implements MustVerifyEmail` ke model `User` dan tambahkan `verified` middleware ke route yang ingin dilindungi.

### 11. Hapus kredensial demo ✅

- [x] Seeder hanya membuat akun demo jika `!app()->environment('production')`.
- [x] Akun `admin@jaggad.id` dan `user@gmail.com` tidak dibuat di production.
- [x] Password `password` tidak digunakan di production.

> **Catatan**: Di production, buat admin pertama melalui `php artisan tinker` atau seeder custom yang aman.

### 12. Tambahkan regression test ✅

- [x] Webhook tanpa Server Key ditolak (`test_webhook_rejected_when_server_key_empty`).
- [x] Signature webhook palsu ditolak (`test_midtrans_webhook_...` — signature assertion).
- [x] Nominal webhook yang berbeda ditolak (`test_midtrans_webhook_...` — amount mismatch assertion).
- [x] Webhook duplikat tetap idempotent (`test_midtrans_webhook_...` — duplicate POST).
- [x] Transaksi sukses tidak dapat turun status (finalized check).
- [x] Checkout paket memberikan semua produk yang benar (`test_package_checkout_uses_server_price_and_real_products`).
- [x] Produk dan rekening berhistori tidak dapat dihapus (`test_historical_master_data_cannot_be_deleted`).
- [x] Admin terakhir dan admin aktif tidak dapat menghapus/dirinya sendiri (`test_last_active_admin_cannot_be_demoted_or_deactivated` + `test_admin_cannot_delete_themselves`).
- [x] Field nullable produk tidak menghasilkan `500` (`test_nullable_product_fields_do_not_cause_server_error`).
- [x] Email verification dinonaktifkan (user bisa langsung akses, tanpa verifikasi).
- [x] Customer tidak dapat menyelesaikan materi milik customer lain (`test_customer_can_complete_only_owned_available_material`).
- [x] Error page production menghasilkan status yang benar (`ErrorPagesTest`).

**Total: 50 test, 204 assertion — lolos semua.**

---

## B. Server dan Konfigurasi ⚠️

> **Bagian ini membutuhkan akses server dan credential production — tidak dapat dilakukan dari repository saja.**

### 13. Siapkan runtime production

Gunakan:
- PHP `8.2` atau lebih baru.
- Composer.
- Nginx atau Apache.
- MySQL atau PostgreSQL untuk database production.
- Ekstensi PHP PDO, GD, cURL, OpenSSL, Mbstring, Fileinfo, Intl, dan ZIP.
- Node.js hanya pada build server bila asset dibangun sebelum release.

Document root web server harus menunjuk ke folder `public`, bukan root repository.

### 14. Gunakan environment production

Contoh dasar:

```dotenv
APP_NAME="JAGGAD Academy"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domain-anda.com
APP_TIMEZONE=Asia/Jakarta

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=jaggad
DB_USERNAME=jaggad_app
DB_PASSWORD=PASSWORD_KUAT

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_HOST=smtp-provider.example
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@domain-anda.com
MAIL_FROM_NAME="JAGGAD Academy"

MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
MIDTRANS_IS_PRODUCTION=true

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://domain-anda.com/auth/google/callback
```

Ketentuan:
- [ ] Jangan commit `.env`.
- [ ] Jangan menyimpan Server Key, SMTP password, atau Google Client Secret di repository.
- [ ] Gunakan secret manager dari hosting bila tersedia.
- [ ] Pastikan `APP_KEY` production dibuat sekali dan ikut dibackup. Jangan menggantinya setelah data terenkripsi digunakan.

Referensi: [Laravel Environment Configuration](https://laravel.com/framework/docs/12.x).

### 15. Amankan server

- [ ] Gunakan sertifikat HTTPS valid.
- [ ] Redirect seluruh HTTP ke HTTPS.
- [ ] Buka hanya port `80`, `443`, dan SSH yang dibatasi.
- [ ] Nonaktifkan directory listing.
- [ ] Batasi ukuran upload sesuai batas aplikasi.
- [ ] Pasang header `X-Content-Type-Options`, `X-Frame-Options`, Referrer Policy, dan Content Security Policy yang sesuai.
- [ ] Gunakan database user khusus aplikasi dengan permission minimum.
- [ ] Pastikan `storage` dan `bootstrap/cache` writable oleh user web server.
- [ ] Pastikan `.env`, log, source map sensitif, dan file backup tidak dapat diakses dari web.

### 16. Siapkan storage dan backup

```bash
php artisan storage:link
```

- [ ] Backup database setiap hari.
- [ ] Backup `storage/app/public` setiap hari.
- [ ] Simpan backup pada server atau provider yang berbeda.
- [ ] Terapkan retention harian, mingguan, dan bulanan.
- [ ] Lakukan satu restore test sebelum go-live.
- [ ] Pastikan bukti pembayaran tidak dapat didaftar melalui directory listing.

### 17. Konfigurasi email nyata

- [ ] Ganti mail driver `log` menjadi SMTP yang valid.
- [ ] Konfigurasikan SPF, DKIM, dan DMARC domain.
- [ ] Uji receipt pembelian, penolakan bukti, reset password, dan verifikasi email.
- [ ] Uji pengiriman ke lebih dari satu provider email.
- [ ] Pastikan kegagalan SMTP tercatat dan admin dapat mengirim ulang receipt.

### 18. Konfigurasi Midtrans

Uji dahulu menggunakan sandbox:
- [ ] Pembuatan Snap token.
- [ ] Pembayaran pending.
- [ ] Settlement atau capture.
- [ ] Deny, cancel, dan expire.
- [ ] Webhook duplikat.
- [ ] Browser ditutup sebelum callback.
- [ ] Customer menekan verifikasi berkali-kali.
- [ ] Nominal dan signature yang dimanipulasi.

Setelah seluruh pengujian lolos:
- [ ] Masukkan production Server Key dan Client Key.
- [ ] Aktifkan `MIDTRANS_IS_PRODUCTION=true`.
- [ ] Atur notification URL HTTPS ke `/midtrans/webhook`.
- [ ] Jangan aktifkan metode Midtrans sebelum production credentials terverifikasi.

### 19. Gunakan satu package manager

- [ ] Pilih npm bila `package-lock.json` menjadi lockfile resmi.
- [ ] Gunakan `npm ci` pada CI dan production build.
- [ ] Jangan bergantian antara npm dan pnpm pada release yang sama.
- [ ] Commit lockfile yang dipilih.

### 20. Jalankan deployment terkontrol

Idealnya build dan test dilakukan sebelum maintenance mode.

```bash
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build
php artisan test
php artisan down
php artisan migrate --force
php artisan storage:link
php artisan optimize
php artisan queue:restart
php artisan up
```

### 21. Jalankan queue worker bila memakai queue

Gunakan Supervisor atau systemd untuk menjalankan worker secara permanen.

Contoh command worker:

```bash
php artisan queue:work --sleep=3 --tries=3 --timeout=60 --max-time=3600
```

- [ ] Pastikan process manager menghidupkan kembali worker bila crash.
- [ ] Jalankan `php artisan queue:restart` setiap deployment.
- [ ] Pantau tabel `failed_jobs`.
- [ ] Nilai `--timeout` harus lebih kecil daripada `retry_after`.

---

## C. Verifikasi Go-Live ⚠️

> **Bagian ini membutuhkan akses staging/production — tidak dapat dilakukan dari repository saja.**

### 22. Uji staging dengan database baru

- [ ] Gunakan konfigurasi yang menyerupai production.
- [ ] Jalankan semua migration tanpa akun demo.
- [ ] Buat satu admin production-like.
- [ ] Buat kategori, produk, materi, rekening, paket, dan customer melalui UI.
- [ ] Pastikan aplikasi tidak bergantung pada ID produk tetap seperti `1` sampai `6`.

### 23. Jalankan matriks transaksi manual

- [ ] Checkout transfer manual berhasil.
- [ ] Harga dari browser yang dimanipulasi diabaikan.
- [ ] Bukti bukan gambar ditolak.
- [ ] Bukti terlalu besar ditolak.
- [ ] Admin menolak bukti beserta alasan.
- [ ] Customer mengunggah ulang bukti.
- [ ] Admin menyetujui bukti baru.
- [ ] Approval kedua tidak menggandakan statistik.
- [ ] Produk yang sudah dimiliki tidak dapat dibeli ulang.
- [ ] Customer lain tidak dapat melihat atau mengubah transaksi.
- [ ] Master data yang memiliki histori tidak dapat dihapus.

### 24. Jalankan customer journey

- [ ] Registrasi.
- [ ] Verifikasi email.
- [ ] Login dan logout.
- [ ] Lupa dan reset password.
- [ ] Beranda dan promo.
- [ ] Katalog, filter, pencarian, dan detail produk.
- [ ] Sales page dan paket.
- [ ] Keranjang dan checkout.
- [ ] Receipt email.
- [ ] Dashboard customer.
- [ ] Membuka materi.
- [ ] Menyelesaikan materi dan melihat progres.
- [ ] Login ulang dan memastikan akses tetap tersedia.

### 25. Jalankan admin journey

- [ ] CRUD kategori.
- [ ] CRUD produk dan upload gambar.
- [ ] CRUD materi.
- [ ] CRUD paket.
- [ ] CRUD rekening.
- [ ] Manajemen user dan status.
- [ ] CMS beranda, tentang, kontak, promo, dan branding.
- [ ] Daftar transaksi dan pagination.
- [ ] Approval, rejection, upload ulang, dan resend email.
- [ ] Export CSV.
- [ ] Customer biasa mencoba membuka seluruh route admin dan harus ditolak.

### 26. Uji tampilan

Periksa desktop dan mobile untuk:
- [ ] Beranda.
- [ ] Produk dan detail produk.
- [ ] Sales page dan paket.
- [ ] Promo.
- [ ] Checkout.
- [ ] Dashboard dan learning.
- [ ] Seluruh halaman admin.
- [ ] Modal, tabel, form, navbar, dan footer.
- [ ] Halaman `403`, `404`, dan `500`.

Periksa juga navigasi keyboard, focus indicator, label form, kontras warna, scroll horizontal, dan reduced motion.

### 27. Periksa runtime sebelum membuka traffic

```bash
php artisan migrate:status
php artisan route:list
php artisan about
php artisan schedule:list
php artisan queue:failed
curl -I https://domain-anda.com/up
```

Pastikan:
- [ ] Minimal satu admin aktif tersedia.
- [ ] Tidak ada akun demo.
- [ ] Minimal satu metode pembayaran aktif.
- [ ] Seluruh produk memiliki slug unik.
- [ ] Seluruh materi memiliki link valid.
- [ ] Storage dapat dibaca dari domain production.
- [ ] Tidak ada exception baru di log.

### 28. Siapkan monitoring

- [ ] Monitor endpoint `/up` setiap satu sampai lima menit.
- [ ] Buat alert untuk HTTP `500` dan downtime.
- [ ] Aktifkan log rotation.
- [ ] Monitor disk, CPU, memory, database connection, dan SSL expiry.
- [ ] Monitor failed jobs dan kegagalan email.
- [ ] Catat kegagalan webhook tanpa menyimpan secret atau data kartu.

### 29. Siapkan rollback

Sebelum deployment:
- [ ] Simpan backup database.
- [ ] Simpan release aplikasi sebelumnya.
- [ ] Catat migration yang akan dijalankan.
- [ ] Hindari migration destruktif pada deployment pertama.

Jika smoke test gagal:
- [ ] Aktifkan maintenance mode.
- [ ] Kembalikan release aplikasi sebelumnya.
- [ ] Jalankan kembali cache aplikasi.
- [ ] Restore database hanya jika migration tidak backward-compatible dan rollback telah diuji.
- [ ] Verifikasi `/up`, login, katalog, dan transaksi sebelum membuka traffic kembali.

### 30. Keputusan akhir GO atau NO-GO

Production hanya dinyatakan **GO** bila seluruh kondisi berikut terpenuhi:

- [ ] Semua temuan P0 dan P1 telah diperbaiki.
- [ ] Semua automated test lulus (50 test, 204 assertion — lolos ✅).
- [ ] Build production berhasil (`npm run build` — lolos ✅).
- [ ] Error page mengembalikan status yang benar (lolos ✅).
- [ ] Midtrans sandbox lulus seluruh skenario.
- [ ] SMTP nyata berhasil mengirim seluruh jenis email.
- [ ] Backup berhasil direstore.
- [ ] Satu transaksi transfer manual staging berhasil end-to-end.
- [ ] Satu transaksi Midtrans staging berhasil end-to-end.
- [ ] Akses produk dan progres customer tetap benar setelah login ulang.
- [ ] Tidak ada error baru pada log setelah smoke test.

---

## Ringkasan Status

### ✅ Selesai di Repository (Kode + Test)

| Item | Status | Test |
|------|--------|------|
| Error page production | ✅ | `ErrorPagesTest` |
| Webhook Midtrans | ✅ | `ProductionReadinessTest::test_midtrans_webhook_...` |
| Finalisasi transaksi (TransactionFinalizer) | ✅ | `ManualBankTransferTest` (6 tests) |
| Paket checkout server-side | ✅ | `ProductionReadinessTest::test_package_checkout_...` |
| Proteksi data historis | ✅ | `ProductionReadinessTest::test_historical_master_data_...` |
| Proteksi admin (self + last) | ✅ | `ProductionReadinessTest::test_last_active_admin_...` + `test_admin_cannot_delete_...` |
| Field nullable admin | ✅ | `ProductionReadinessTest::test_nullable_product_fields_...` |
| Materi + progres pembelajaran | ✅ | `ProductionReadinessTest::test_customer_can_complete_...` |
| Status user normalisasi | ✅ | `ProductionReadinessTest::test_inactive_user_...` |
| Verifikasi email | Dinonaktifkan (sesuai permintaan) | - |
| Kredensial demo hanya di local | ✅ | Seeder guard |
| Regression test suite | ✅ | 50 test, 204 assertion |
| Build Vite | ✅ | `npm run build` |

### ⚠️ Butuh Aksi Anda

| Item | Alasan |
|------|--------|
| Server production | Butuh VPS/hosting + domain |
| .env production | Butuh credential SMTP, Midtrans, Google, Meta |
| SMTP real | Butuh provider email (SendGrid, Mailgun, dll.) |
| Midtrans production | Butuh Server Key & Client Key production |
| Google OAuth | Butuh Client ID & Secret dari Google Console |
| Backup & monitoring | Butuh konfigurasi di server |
| QA manual | Butuh akses staging/production |
| Materi produk | Isi link materi melalui admin panel |
| Master paket CRUD (opsional) | Jika ingin admin UI untuk paket bundling |
