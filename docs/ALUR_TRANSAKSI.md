# Alur Transaksi JAGGAD Academy

Dokumen ini menggambarkan implementasi source code per 7 September 2026. Sumber kebenaran nominal adalah database/config server; browser tidak dipercaya untuk harga atau status pembayaran.

## 1. Gambaran umum

```text
Produk/paket dipilih
  -> customer login
  -> POST /checkout
  -> transaksi pending dibuat secara atomic
  -> Midtrans Snap ATAU transfer manual
  -> TransactionFinalizer
  -> transaksi success + akses produk + statistik
  -> email receipt + Meta CAPI
```

Sumber hak akses materi adalah pasangan unik `user_id + product_id` pada `user_products`. Status transaksi saja tidak memberi akses.

## 2. Keranjang dan resolusi harga

- Keranjang UI disimpan pada `localStorage` dengan key `jaggad_cart`.
- Request dibatasi maksimal 50 item.
- Produk biasa dikirim sebagai ID, lalu backend membaca ulang produk dan `price` dari database.
- Paket dikirim sebagai `package_slug`, lalu backend membaca `config/packages.php`, memastikan seluruh produk anggota ada, dan memakai harga package dari config.
- Halaman paket juga menerima nama/harga server agar angka yang ditampilkan sama dengan checkout.
- Paket yang salah satu produknya tidak tersedia menghasilkan 404 dan tidak ditawarkan untuk dibeli.
- Duplikat produk dalam request tidak membuat akses/statistik ganda.

## 3. Pembuatan transaksi

`POST /checkout` hanya dapat dipanggil user aktif yang login dan dibatasi 10 request/menit.

Backend melakukan:

1. Validasi metode pembayaran aktif.
2. Resolusi produk/paket dan hitung ulang total di server.
3. Dalam satu database transaction, membuat `transactions`, `transaction_items`, dan bila manual satu `payments`.
4. Untuk Midtrans, meminta Snap token sesudah data transaksi siap.

Setiap percobaan pembayaran baru memakai kode transaksi baru. Transaksi lama yang tidak dilanjutkan tetap menjadi histori pending dan tidak digunakan kembali.

Jika pembuatan Snap token gagal:

- transaksi tetap pending;
- tidak ada akses produk;
- keranjang tidak dibersihkan;
- browser menampilkan kegagalan, bukan sukses;
- detail exception hanya masuk log server.

## 4. Midtrans

### 4.1 Browser

Setelah mendapat Snap token, frontend memanggil `window.snap.pay`.

- Callback success/pending tidak dipercaya sebagai bukti final.
- Browser memanggil `POST /checkout/verify/{transaction}`.
- Keranjang baru dibersihkan setelah backend memastikan status sukses.
- Error/cancel/pending mempertahankan keranjang agar customer dapat melanjutkan.

Endpoint verify:

- hanya dapat digunakan pemilik transaksi atau admin;
- hanya menerima transaksi yang mempunyai Snap token;
- meminta status langsung ke Midtrans;
- mencocokkan `order_id` dan `gross_amount`;
- menerima `settlement`, atau `capture` dengan `fraud_status=accept`;
- menolak `capture` dengan `fraud_status=deny`;
- dibatasi 10 request/menit.

### 4.2 Webhook

`POST /midtrans/webhook` adalah satu-satunya route yang dikecualikan dari CSRF.

Sebelum mengubah transaksi, controller:

1. Memastikan Server Key tersedia.
2. Memvalidasi field wajib.
3. Menghitung SHA-512 dari `order_id + status_code + gross_amount + server_key`.
4. Membandingkan signature dengan `hash_equals`.
5. Mencocokkan nominal dengan total database.

Pemetaan status:

| Midtrans | Syarat tambahan | Status aplikasi |
|---|---|---|
| `settlement` | — | `success` |
| `capture` | `fraud_status=accept` | `success` |
| `capture` | `fraud_status=deny` | `failed` |
| `deny`, `cancel`, `failure` | — | `failed` |
| `expire` | — | `expired` |
| lainnya | — | tetap `pending` |

Signature webhook tidak disimpan ke `payment_payload`. Webhook duplikat aman karena finalizer idempotent, dan transaksi yang sudah sukses tidak boleh turun status.

## 5. Transfer manual

Customer memilih payment method manual yang aktif dan mengunggah bukti:

- format raster yang diizinkan divalidasi backend;
- maksimal 5 MB;
- dimensi maksimal 8.000 × 8.000;
- dikonversi ke WebP kualitas 80;
- disimpan pada disk privat `storage/app/private/payments`.

Upload/submit bukti dibatasi 5 request/menit. Bukti tidak memiliki URL publik. Route `payments.proof` hanya mengirim file kepada pemilik transaksi atau admin; guest dan customer lain ditolak.

Admin dapat:

- approve: finalisasi transaksi menjadi sukses;
- reject: payment menjadi rejected dan transaksi failed, disertai alasan;
- resend receipt untuk transaksi sukses.

Approve berulang tidak menggandakan akses atau statistik.

## 6. TransactionFinalizer

Semua jalur sukses—verify browser, webhook, dan approve admin—melewati `TransactionFinalizer`.

Di dalam database transaction finalizer:

1. Mengunci row transaksi dengan `lockForUpdate`.
2. Berhenti tanpa efek jika sudah sukses.
3. Menetapkan `status=success` dan `paid_at`.
4. Menambah kepemilikan dengan `syncWithoutDetaching`.
5. Menambah `sold_count` setiap produk sekali.
6. Menambah `purchase_count` dan `total_spent` user sekali.

Setelah commit:

- receipt dikirim;
- Meta CAPI Purchase dikirim;
- kegagalan salah satu integrasi dicatat tetapi tidak mencabut akses.

## 7. Email dan Meta

- Receipt dikirim untuk transaksi sukses dan dapat dikirim ulang admin.
- Email penolakan dikirim pada penolakan bukti manual.
- SMTP memiliki timeout agar request tidak menggantung.
- Meta Pixel browser dan CAPI server memakai `transaction_code` sebagai `event_id` yang sama untuk deduplikasi Purchase.
- Email dan telepon di-hash SHA-256 sebelum dikirim ke Meta.
- Graph API version dapat dikonfigurasi dan default saat audit adalah v26.0.

## 8. Materi dan progress

- Endpoint publik menghapus `materials[*].link` dari payload produk.
- Halaman learning memeriksa kepemilikan `user_products`.
- Hanya pemilik produk yang menerima link materi.
- Penyelesaian materi dicatat unik berdasarkan user, produk, dan index.
- Materi kosong/tanpa link tidak dapat ditandai selesai.
- Admin hanya boleh menyimpan link materi HTTP/HTTPS.

## 9. Invariant keamanan

Perubahan transaksi harus mempertahankan semua aturan berikut:

- Harga selalu dihitung ulang server-side.
- Pembuatan transaksi dan item atomic.
- Metode pembayaran harus aktif.
- Hanya satu jalur finalisasi.
- Finalisasi harus memakai row lock dan idempotent.
- Status sukses tidak boleh diturunkan.
- Nominal/order Midtrans harus sama dengan database.
- `capture` bukan sukses tanpa fraud accept.
- Bukti transfer dan link materi tidak boleh menjadi asset publik.
- Kegagalan provider eksternal tidak boleh merusak data yang sudah committed.
- User inactive tidak boleh melanjutkan session.

## 10. Matriks pengujian sebelum live

| Skenario | Otomatis | Wajib sandbox/live |
|---|---:|---:|
| Harga browser dimanipulasi | Ya | Opsional |
| Metode nonaktif | Ya | Opsional |
| Snap token gagal | Ya | Ya |
| Webhook signature/nominal salah | Ya | Ya |
| Webhook duplikat/race finalisasi | Ya | Ya |
| Settlement | Simulasi | Ya |
| Capture accept/deny | Simulasi | Ya |
| Cancel/deny/expire | Simulasi | Ya |
| Transfer manual approve/reject | Ya | Ya |
| Privasi bukti antar-user | Ya | Ya |
| Receipt/reset/rejection email | Sebagian | Ya |
| Pixel/CAPI deduplication | Payload diuji | Ya, Test Events |

## 11. Batasan yang disengaja

- Package belum memiliki CRUD admin; perubahan dilakukan melalui config dan deploy.
- Tidak ada quantity; satu transaksi mempunyai paling banyak satu unit tiap produk.
- Belum ada refund/chargeback otomatis, coupon, pajak/invoice fiskal, atau rekonsiliasi settlement.
- Webinar/kelas offline belum memiliki seat inventory.
- Email verification akun sengaja nonaktif.

Jika fitur di atas dibutuhkan untuk peluncuran, masukkan sebagai blocker bisnis sebelum go-live. Checklist infrastruktur dan sign-off berada di `docs/PRODUCTION_READINESS_CHECKLIST.md`.
