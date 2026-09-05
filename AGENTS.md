# AGENTS.md — JAGGAD Academy

> Platform edukasi digital Indonesia — Laravel 12 + React 18 (Inertia.js).
> Panduan lengkap untuk AI agents dan developer yang bekerja di codebase ini.

---

## 1. Ringkasan Proyek

**JAGGAD Academy** adalah platform e-commerce edukasi digital untuk menjual produk pembelajaran (ebook, video kelas, webinar, kelas offline) kepada pelanggan Indonesia. Platform ini mencakup halaman publik, dashboard pelanggan, dan panel admin CMS lengkap.

**Tujuan utama:** Pelanggan memahami penawaran, membeli dengan percaya diri, menyelesaikan pembayaran, dan mengakses materi belajar. Tim admin mengelola konten dan perdagangan tanpa deploy kode.

---

## 2. Tech Stack

| Layer | Teknologi | Versi |
|---|---|---|
| Backend | Laravel | 12.x (PHP 8.2+) |
| Frontend | React + Inertia.js | 18.x + 2.x |
| Styling | Custom Vanilla CSS | — |
| CSS Utility | Tailwind CSS | 3.x |
| Build Tool | Vite | 7.x |
| Database | MySQL (produksi) / SQLite (lokal) | — |
| Payment | Midtrans | SDK PHP 2.6 |
| Auth | Session + Google OAuth (Socialite) | — |
| Tracking | Meta Pixel + Conversions API | — |
| Icons | lucide-react | 0.577+ |
| Charts | recharts | 3.x |
| Toast | react-hot-toast | 2.x |
| Alerts | sweetalert2 | 11.x |
| Routing | Ziggy (Laravel routes di JS) | 2.x |
| Image | Intervention Image | 4.x |

---

## 3. Struktur Direktori

```
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/                    # 7 controller admin (Dashboard, Product, Category, Transaction, User, Payment, Setting)
│   │   │   ├── Auth/                     # 11 controller autentikasi (Breeze + Google OAuth)
│   │   │   ├── CheckoutController.php    # Alur pembayaran Midtrans & manual
│   │   │   ├── MidtransWebhookController.php  # Webhook server-to-server + Meta CAPI
│   │   │   ├── PublicController.php      # Home, products, product detail, sales, promo
│   │   │   ├── UserController.php        # Dashboard pelanggan, akses materi, progress
│   │   │   └── ProfileController.php     # Edit profil
│   │   ├── Middleware/
│   │   │   ├── HandleInertiaRequests.php # Share data global ke React (site content, auth, meta)
│   │   │   └── AdminMiddleware.php       # Cek role === 'admin'
│   │   └── Requests/                     # Form request validation
│   ├── Mail/
│   │   ├── PurchaseReceiptMail.php       # Email struk pembelian
│   │   └── PaymentRejectedMail.php       # Email penolakan pembayaran
│   ├── Models/                           # 8 model: User, Product, Category, Transaction, TransactionItem, Payment, PaymentMethod, SiteContent
│   ├── Providers/
│   └── Services/
│       └── TransactionFinalizer.php      # Finalisasi transaksi (idempotent + Meta CAPI)
│
├── database/
│   ├── migrations/                       # 30 migration files
│   └── seeders/
│       └── InitialDataSeeder.php         # Data awal: users, kategori, produk, payment methods, site content
│
├── resources/
│   ├── css/
│   │   ├── app.css                       # CSS entry point
│   │   └── errors.css                    # Error page styles
│   ├── js/
│   │   ├── app.jsx                       # Inertia app bootstrap + Meta Pixel init
│   │   ├── bootstrap.js                  # Axios setup
│   │   ├── Components/                   # 20 komponen reusable (Navbar, Footer, ProductCard, dll)
│   │   ├── Contexts/
│   │   │   ├── CartContext.jsx            # Keranjang belanja (localStorage)
│   │   │   └── ContentContext.jsx         # Site content dari CMS admin
│   │   ├── Data/                         # Data statis JSON (categories, products, packages, testimonials, dll)
│   │   ├── Layouts/
│   │   │   ├── MainLayout.jsx            # Layout publik (floating nav + footer)
│   │   │   ├── AdminLayout.jsx           # Layout admin (sidebar + header)
│   │   │   ├── AuthenticatedLayout.jsx   # Layout pelanggan terautentikasi
│   │   │   └── GuestLayout.jsx           # Layout guest (login/register)
│   │   ├── Pages/
│   │   │   ├── Admin/                    # 13 halaman admin
│   │   │   ├── Auth/                     # 6 halaman auth (login, register, reset, dll)
│   │   │   ├── Guest/                    # 9 halaman publik (home, products, checkout, dll)
│   │   │   ├── Profile/                  # 1 halaman edit profil
│   │   │   ├── User/                     # 3 halaman pelanggan (dashboard, learning, edit profile)
│   │   │   ├── Dashboard.jsx             # Dashboard pelanggan utama
│   │   │   └── Error.jsx                 # Error page
│   │   ├── Styles/
│   │   │   ├── Global.css                # CSS variables, font imports, reset, global utilities
│   │   │   └── variables.css             # Design tokens (colors, spacing, typography)
│   │   └── Utils/
│   │       ├── useMetaPixel.js           # Hook tracking Meta Pixel events
│   │       ├── helpers.js                # Fungsi utilitas umum
│   │       ├── materialLinks.js          # Konfigurasi link materi
│   │       ├── materialLinks.test.mjs    # Test material links
│   │       ├── salesContent.js           # Konten halaman sales
│   │       ├── promoContent.js           # Konten halaman promo
│   │       ├── promoContent.test.mjs     # Test promo content
│   │       ├── activityRotation.js       # Rotasi aktivitas
│   │       ├── activityRotation.test.mjs # Test activity rotation
│   │       └── confirmLogout.js          # Konfirmasi logout
│   └── views/
│       ├── app.blade.php                # Blade template utama (SPA shell)
│       ├── errors/                       # Error page templates
│       └── mail/                         # Email templates Blade
│
├── routes/
│   ├── web.php                           # Semua rute aplikasi
│   ├── auth.php                          # Rute autentikasi Breeze
│   └── console.php                       # Rute artisan
│
├── config/                               # Konfigurasi Laravel standar
├── docs/
│   ├── ALUR_TRANSAKSI.md                 # Dokumentasi lengkap alur transaksi
│   └── PRODUCTION_READINESS_CHECKLIST.md # Checklist kesiapan produksi
├── scripts/
│   └── check-font-size.mjs              # Pre-build font size validation
├── tests/
│   ├── Feature/                          # 16 test files
│   └── Unit/                             # 1 test file
├── .agents/                              # Agent skills dan workflows
├── DESIGN.md                             # Design system lengkap
├── PRODUCT.md                            # Produk brief
├── vite.config.js                        # Vite + Laravel + React config
├── tailwind.config.js                    # Tailwind config (Chillax + Synonym fonts)
├── jsconfig.json                         # Path aliases (@/* -> resources/js/*)
└── phpunit.xml                           # PHPUnit config (SQLite in-memory)
```

---

## 4. Model & Database

### 4.1 Model Utama

| Model | Tabel | Relasi Utama |
|---|---|---|
| `User` | `users` | hasMany: transactions, userProducts; hasOne: — |
| `Product` | `products` | belongsTo: category; hasMany: transactionItems, userProducts |
| `Category` | `categories` | hasMany: products |
| `Transaction` | `transactions` | belongsTo: user; hasMany: items; hasOne: payment |
| `TransactionItem` | `transaction_items` | belongsTo: transaction, product |
| `Payment` | `payments` | belongsTo: transaction, paymentMethod |
| `PaymentMethod` | `payment_methods` | hasMany: payments |
| `SiteContent` | `site_contents` | — (key-value store untuk CMS) |

### 4.2 Tabel Penting

- **`user_products`**: Tabel pivot kepemilikan produk (`user_id`, `product_id`, `purchased_at`). Sumber hak akses materi.
- **`material_progress`**: Tracking progress materi per user (`user_id`, `product_id`, `material_index`, `completed_at`).
- **`site_contents`**: CMS key-value store (`key`, `value` sebagai JSON). Menyimpan: `site_content`, `ads_promo`, `site_settings`.

### 4.3 Status Transaksi

| Status | Arti |
|---|---|
| `pending` | Menunggu pembayaran |
| `success` | Pembayaran berhasil, akses diberikan |
| `failed` | Pembayaran gagal/ditolak |
| `expired` | Pembayaran kedaluwarsa |

### 4.4 Status Payment

| Status | Arti |
|---|---|
| `pending` | Bukti menunggu verifikasi |
| `verified` | Bukti diverifikasi |
| `rejected` | Bukti ditolak |

### 4.5 Status User

Format tidak konsisten — hati-hati:
- Migration default: `active`
- Seeder: `active`
- Registrasi baru: `Aktif`
- Admin toggle: `Aktif` / `Nonaktif`

---

## 5. Autentikasi & Otorisasi

### 5.1 Middleware

- `auth` — Harus login (session-based).
- `verified` — Email terverifikasi (belum efektif karena User tidak implement `MustVerifyEmail`).
- `admin` — Role harus `admin` (`AdminMiddleware`).

### 5.2 Login

- **Password**: Standard Breeze login via `POST /login`.
- **Google OAuth**: `GET /auth/google` → redirect Google → callback → create/login user.

### 5.3 Registrasi

- `POST /register`: name, email, password, password_confirmation.
- Status default: `Aktif`, role: `customer`.

### 5.4 Data Shared ke Frontend

`HandleInertiaRequests` middleware share:
- `auth` (user object)
- `siteContent` (CMS data: branding, home, about, contact, dashboard)
- `meta_pixel_id`
- `flash` messages

---

## 6. Routing

### 6.1 Rute Publik

```
GET  /                                    # Home (PublicController@home)
GET  /products                            # Katalog (PublicController@products)
GET  /products/{slug}                     # Detail produk (PublicController@productDetail)
GET  /products/{slug}/sales               # Landing penjualan (PublicController@productSales)
GET  /promo                               # Halaman promo (PublicController@promo)
GET  /packages/{slug}                     # Landing paket (static data)
GET  /about                               # Tentang kami
GET  /contact                             # Hubungi kami
POST /midtrans/webhook                    # Webhook Midtrans (tidak perlu auth)
```

### 6.2 Rute Auth

```
GET/POST /login
GET/POST /register
POST /logout
GET  /forgot-password
POST /email/password/reset
GET  /verify-email
GET  /auth/google                         # Google OAuth redirect
GET  /auth/google/callback                # Google OAuth callback
```

### 6.3 Rute Pelanggan (auth)

```
GET  /dashboard                           # Dashboard
GET  /dashboard/learning/{slug}           # Halaman materi
POST /dashboard/learning/{slug}/materials/{index}/complete  # Tandai selesai
GET  /checkout                            # Checkout page
POST /checkout                            # Proses checkout
POST /checkout/verify/{transaction}       # Verifikasi pembayaran
POST /dashboard/transactions/{id}/proof   # Upload bukti transfer
GET  /profile                             # Edit profil
PATCH /profile                            # Update profil
```

### 6.4 Rute Admin (auth + admin)

```
GET    /admin/dashboard
GET    /admin/products                    # List produk
GET    /admin/products/create             # Form tambah
POST   /admin/products                    # Simpan produk baru
GET    /admin/products/{slug}/edit        # Form edit
POST|PUT /admin/products/{slug}           # Update produk
DELETE /admin/products/{slug}             # Hapus produk
POST   /admin/products/{slug}/landing-blocks  # Update landing blocks

GET    /admin/categories
POST   /admin/categories
PUT    /admin/categories/{id}
DELETE /admin/categories/{id}

GET    /admin/transactions                # List transaksi (20/halaman)
GET    /admin/transactions/export         # Export CSV
PATCH  /admin/transactions/{id}/approve   # Setujui pembayaran
PATCH  /admin/transactions/{id}/reject    # Tolak pembayaran
POST   /admin/transactions/{id}/resend-access-email

GET    /admin/users
POST   /admin/users
PUT    /admin/users/{id}
PATCH  /admin/users/{id}/toggle           # Toggle status aktif/nonaktif
DELETE /admin/users/{id}

GET    /admin/testimonials
GET    /admin/content                     # CMS konten
POST   /admin/content
GET    /admin/ads                         # CMS promo/ads
POST   /admin/ads
GET    /admin/payment                     # Metode pembayaran
POST   /admin/payment
PUT    /admin/payment/{id}
PATCH  /admin/payment/{id}/toggle
DELETE /admin/payment/{id}

GET    /admin/settings                    # Pengaturan integrasi
POST   /admin/settings
GET    /admin/chatbot                     # Chatbot admin
```

---

## 7. Alur Pembayaran

### 7.1 Midtrans (QRIS, VA, Kartu, E-wallet)

```
1. Customer pilih produk → masuk keranjang (localStorage)
2. Customer buka /checkout → pilih metode Midtrans
3. POST /checkout → backend buat Transaction (pending) + TransactionItem
4. Backend buat Snap token via Midtrans API
5. Browser jalankan window.snap.pay(token)
6. Customer selesaikan pembayaran di popup Midtrans
7. Browser panggil POST /checkout/verify/{id} → backend cek status ke Midtrans
8. Jika success → user_products dibuat, sold_count +1, email struk dikirim
9. Webhook Midtrans juga kirim POST /midtrans/webhook → finalisasi server-side
10. Meta CAPI Purchase event dikirim dari server
```

### 7.2 Pembayaran Manual (Transfer Bank)

```
1. Customer pilih metode bank manual
2. Upload bukti transfer (WebP, max 5MB)
3. POST /checkout → backend buat Transaction (pending) + Payment (pending)
4. Admin review di /admin/transactions
5. Approve → Transaction success → user_products dibuat
   Reject → Transaction failed → payment rejected
```

### 7.3 Penting

- **Harga dipercaya dari browser** — Backend tidak membaca ulang harga dari database. Ini risiko keamanan.
- **`TransactionFinalizer`** — Service untuk finalisasi idempotent (lock row + cek status sebelum proses).
- **Webhook signature** — Diverifikasi menggunakan SHA512: `order_id + status_code + gross_amount + server_key`.

---

## 8. Konvensi Kode

### 8.1 PHP / Laravel

- **PSR-4 autoloading**: namespace `App\` → `app/`.
- **Controller naming**: `Admin{Entity}Controller` untuk admin, `{Entity}Controller` untuk publik.
- **Model**: Singular, PascalCase (`Product`, `TransactionItem`).
- **Migration**: Timestamp prefix, snake_case, deskriptif.
- **Route naming**: Dot notation (`admin.products.index`, `checkout.process`).
- **Middleware**: Di-register di `bootstrap/app.php` atau `Kernel`.
- **Validation**: Gunakan Form Request classes untuk complex validation.
- **No enum database** — Status transaksi/payment pakai string bebas.
- **JSON columns**: `benefits`, `materials`, `payment_payload` disimpan sebagai JSON string via `json_encode`/`json_decode`.

### 8.2 React / Frontend

- **Path alias**: `@/*` → `resources/js/*` (dijsconfig.json).
- **Page components**: File per halaman di `resources/js/Pages/{Area}/`.
- **Naming**: PascalCase files (`AdminProducts.jsx`, `ProductDetail.jsx`).
- **CSS per halaman**: File `.jsx` punya file `.css` companion (e.g., `Admin.css`, `Products.css`).
- **Layouts**: Ditetapkan di page component via Inertia `layout` property.
- **No TypeScript** — Semua file `.jsx` / `.js`.
- **State management**: React Context (CartContext, ContentContext) + localStorage untuk keranjang.
- **Data fetching**: Inertia.js props (server-side), bukan client-side fetch.
- **Route access**: Gunakan `route()` dari Ziggy (`usePage()` atau `import { route } from 'ziggy-js'`).

### 8.3 CSS

- **Global tokens**: `resources/js/Styles/variables.css` — CSS custom properties untuk warna, spacing, typography.
- **Global styles**: `resources/js/Styles/Global.css` — Reset, font imports, utility classes.
- **Per-page CSS**: File CSS di folder yang sama dengan komponen (e.g., `Pages/Guest/Products.css`).
- **Tailwind**: Digunakan untuk utility classes, tapi proyek ini lebih banyak pakai custom vanilla CSS.
- **Font**: Chillax (display) + Synonym (body) — di-load via `@font-face` di Global.css.
- **Desain system**: Lihat `DESIGN.md` untuk detail lengkap (warna, tipografi, spacing, komponen).

### 8.4 Naming Conventions

| Area | Convention | Contoh |
|---|---|---|
| PHP class | PascalCase | `AdminProductController` |
| PHP method | camelCase | `productDetail()` |
| Database table | snake_case, plural | `transaction_items` |
| Database column | snake_case | `sold_count`, `payment_type` |
| Route name | dot notation, snake_case | `admin.products.index` |
| React component | PascalCase | `ProductCard.jsx` |
| CSS class | kebab-case | `.admin-layout`, `.product-card` |
| CSS variable | kebab-case with prefix | `--color-primary-maroon` |
| JS variable/function | camelCase | `handleGoogleCallback` |

---

## 9. Environment & Configuration

### 9.1 File `.env`

```env
APP_NAME="JAGGAD ACADEMY"
APP_ENV=local          # production di server
APP_KEY=               # generate via php artisan key:generate
APP_DEBUG=true         # false di produksi
APP_URL=http://localhost

DB_CONNECTION=sqlite   # mysql di produksi
DB_DATABASE=database/database.sqlite

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=public
```

### 9.2 Pengaturan via Database (Admin CMS)

Kredensial API **tidak disimpan di `.env`** — dikelola lewat Admin → Settings dan disimpan di `site_contents` table:

| Key | Deskripsi |
|---|---|
| `midtrans_server_key` | Server key Midtrans |
| `midtrans_client_key` | Client key Midtrans |
| `midtrans_is_production` | Boolean mode produksi |
| `google_client_id` | Google OAuth Client ID |
| `google_client_secret` | Google OAuth Client Secret |
| `meta_pixel_id` | Meta Pixel ID (16 digit) |
| `meta_access_token` | Meta Conversions API Token |

### 9.3 Path Aliases

```javascript
// jsconfig.json
"@/*": ["resources/js/*"]
"ziggy-js": ["./vendor/tightenco/ziggy"]
```

---

## 10. Testing

### 10.1 Perintah

```bash
# Jalankan semua test
php artisan test

# Jalankan test spesifik
php artisan test --filter=AuthenticationTest
php artisan test tests/Feature/Auth/

# Jalankan dengan output verbose
php artisan test --verbose

# Hapus cache sebelum test
php artisan config:clear --ansi && php artisan test
```

### 10.2 Konfigurasi

- **Framework**: PHPUnit 11.x
- **Database testing**: SQLite in-memory (otomatis di-reset tiap test)
- **Environment**: `APP_ENV=testing`, `CACHE_STORE=array`, `QUEUE_CONNECTION=sync`
- **File config**: `phpunit.xml`

### 10.3 Test Files

```
tests/
├── Feature/
│   ├── Auth/                           # 7 test auth (login, register, password reset, dll)
│   ├── AuthenticationTest.php
│   ├── RegistrationTest.php
│   ├── ProfileTest.php
│   ├── CategorySlugTest.php
│   ├── ContactContentTest.php
│   ├── PromoContentTest.php
│   ├── ErrorPagesTest.php
│   ├── HomeToastProductsTest.php
│   ├── ManualBankTransferTest.php
│   ├── ProductionReadinessTest.php
│   └── ExampleTest.php
├── Unit/
│   └── ExampleTest.php
└── TestCase.php                        # Base test case
```

### 10.4 Frontend Tests

```javascript
// Unit test files di resources/js/Utils/
promoContent.test.mjs
activityRotation.test.mjs
materialLinks.test.mjs
```

### 10.5 Menulis Test

- Test PHP di `tests/Feature/` untuk integrasi, `tests/Unit/` untuk unit.
- Gunakan `$this->artisan()` untuk command test.
- Gunakan `$this->get()` / `$this->post()` untuk route test.
- Database otomatis di-reset menggunakan `RefreshDatabase` trait.
- Untuk test admin, buat user dengan `role = 'admin'` dan login sebagai user tersebut.

---

## 11. Build & Development

### 11.1 Development

```bash
# Install dependencies
composer install
npm install

# Jalankan development (dua terminal)
php artisan serve          # Terminal 1: Backend
npm run dev                # Terminal 2: Frontend

# Atau menggunakan composer script (4 proses sekaligus)
composer dev
```

### 11.2 Build Produksi

```bash
npm run build              # Vite build
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### 11.3 Pre-build Check

```bash
npm run check:font-size    # Validasi ukuran font (otomatis jalan sebelum build)
```

### 11.4 Database

```bash
php artisan migrate                            # Jalankan migration
php artisan migrate:refresh                    # Reset & migrate ulang
php artisan db:seed --class=InitialDataSeeder  # Seed data awal
php artisan storage:link                       # Buat symlink public/storage
```

---

## 12. Desain System

### 12.1 Warna

| Token | Hex | Kegunaan |
|---|---|---|
| `--color-primary-maroon` | `#660810` | Aksi utama, brand color |
| `--color-primary-hover` | `#9b111b` | Hover state |
| `--color-ink` | `#171316` | Heading, teks high-emphasis |
| `--color-copy` | `#67555c` | Body text, supporting text |
| `--color-bg` | `#fbfcff` | Cool white, page background |
| `--color-bg-soft` | `#f7f3f4` | Alternating sections |
| `--color-bg-card` | `#ffffff` | Card surfaces |
| `--color-border` | `#ded4d7` | Dividers |
| `--color-border-field` | `#d8cdd1` | Input borders |

### 12.2 Tipografi

- **Display**: Chillax, extra-bold (800), fluid 2.8rem–4.25rem
- **Body**: Synonym, regular (400), 1rem, line-height 1.7
- **Label**: Synonym, semi-bold (600), 1rem

### 12.3 Komponen

- **Button primary**: Pill-shaped, maroon bg, white text, min-height 54px
- **Button secondary**: White bg, ink text, warm border
- **Cards**: 16px border-radius, white bg, subtle maroon-tinted shadows
- **Fields**: White bg, 10px border-radius, 52px min-height, warm border
- **Navigation**: Floating white pill, 60px height, maroon-tinted shadow

---

## 13. Integrasi Penting

### 13.1 Midtrans

- **SDK**: `midtrans/midtrans-php` v2.6
- **Config**: Ambil dari database `site_settings`, bukan `.env`
- **Snap Token**: Dibuat di backend, dijalankan di frontend via `window.snap.pay(token)`
- **Webhook**: `POST /midtrans/webhook` — verifikasi SHA512 signature
- **Self-healing**: Jika Client Key terisi, otomatis buat entri Midtrans di payment methods

### 13.2 Google OAuth

- **Package**: `laravel/socialite` v5.25
- **Config**: Dari database `site_settings`
- **Flow**: `/auth/google` → Google → `/auth/google/callback`
- **Behavior**: Jika email sudah ada, isi `google_id`/`avatar`. Jika belum, buat user baru.

### 13.3 Meta Pixel + Conversions API

- **Client-Side**: PageView (every nav), ViewContent (product detail), InitiateCheckout, Purchase
- **Server-Side**: Purchase via Conversions API (dari webhook dan admin approve)
- **User data**: Email & phone di-hash SHA256 sebelum dikirim
- **Config**: Pixel ID dan Access Token dari database `site_settings`

### 13.4 Image Processing

- **Package**: `intervention/image` v4.1
- **Usage**: Upload bukti pembayaran dikonversi ke WebP kualitas 80
- **Storage**: `storage/app/public/payments/`

---

## 14. Keamanan

### 14.1 Yang Sudah Diterapkan

- CSRF protection (kecuali webhook Midtrans)
- Session-based auth dengan Sanctum
- Password hashing (bcrypt)
- Admin middleware check role
- Midtrans webhook signature verification (SHA512)
- Meta CAPI user data hashing (SHA256)
- `.env` excluded dari git
- APP_DEBUG=false di produksi

### 14.2 Yang Perlu Diperhatikan

- **Harga dari browser** — Tidak divalidasi ulang di backend. **RISIKO KRITIS.**
- **Status user tidak konsisten** — Multiple format (`active`, `Aktif`, `Nonaktif`)
- **Session tidak re-check** — User yang dinonaktifkan tetap bisa akses sampai session habis
- **Google OAuth tidak cek status nonaktif**
- **Bukti manual tidak diwajibkan di backend** (hanya di frontend)

---

## 15. Known Issues & Tech Debt

### Kritis

1. Harga dipercaya dari browser — backend tidak membaca ulang `products.price`
2. Approval admin tidak idempotent — bisa double-count statistik
3. Kegagalan Snap token bisa tampil sebagai sukses di frontend

### Tinggi

4. Status `success` bisa berubah kembali ke `failed`/`expired` via webhook tanpa pencabutan akses
5. Race condition antara verify browser dan webhook
6. Pembuatan transaksi tidak atomic (bukan satu DB transaction)
7. Paket (`pkg-*`) tidak bisa dibayar karena ID tidak ada di database

### Menengah

8. Metode nonaktif bisa dipakai via request langsung
9. Metadata lama tidak dibersihkan saat ubah metode
10. Tipe file bukti tidak konsisten antara frontend dan backend
11. Route Google OAuth dideklarasikan dua kali
12. Filter admin hanya bekerja pada 20 transaksi halaman saat ini

---

## 16. Deployment

### 16.1 Server Requirements

- PHP >= 8.2 (extensions: curl, mbstring, openssl, pdo, tokenizer, xml)
- Composer & Node.js >= 18
- Web server: Nginx atau Apache (document root ke `/public`)
- MySQL (produksi)

### 16.2 Quick Deploy

```bash
git pull origin main
composer install --no-dev --optimize-autoloader
npm install && npm run build
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=InitialDataSeeder
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan optimize
```

### 16.3 Permissions

```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data /var/www/jaggad
```

### 16.4 Webhook Setup

Di dashboard Midtrans:
- **Notification URL**: `https://domain.com/midtrans/webhook`
- **Finish Redirect URL**: `https://domain.com/dashboard`
- **Error Redirect URL**: `https://domain.com/checkout`

---

## 17. Debugging & Troubleshooting

| Masalah | Solusi |
|---|---|
| Tampilan rusak saat refresh | `npm run build` ulang |
| Produk 404 | Fix slug via tinker (lihat README) |
| 413 Entity Too Large | Set `client_max_body_size 7M` di Nginx + `upload_max_filesize = 5M` di PHP |
| Midtrans error | Admin → Settings → isi Server Key & Client Key |
| Webhook error | Pastikan URL HTTPS publik, gunakan ngrok untuk testing lokal |
| Gambar tidak muncul | `php artisan storage:link` |
| Meta Pixel tidak tracking | Cek Pixel ID di Admin → Settings, gunakan Meta Pixel Helper |
| Error 500 setelah migrate | `php artisan config:clear && php artisan cache:clear` |
| Google Login gagal | Isi Client ID/Secret di Admin → Settings, verifikasi redirect URL di Google Cloud Console |

---

## 18. Terminologi

Gunakan istilah ini secara konsisten di kode dan dokumen:

| Istilah | Arti |
|---|---|
| Produk | Item yang dijual (ebook, video kelas, webinar, kelas offline) |
| Kategori | Jenis produk |
| Checkout | Proses pembelian |
| Transaksi | Record pembelian (transaction + items + payment) |
| Pembayaran | Proses transfer dana (Midtrans atau manual) |
| Dashboard | Halaman pelanggan setelah login |
| Materi | Konten belajar dalam produk |
| Keranjang | Cart di browser (localStorage) |
| CMS | Panel admin untuk mengelola konten |
| Site Settings | Pengaturan integrasi (Midtrans, Google, Meta) |
| Landing page | Halaman penjualan produk (`/products/{slug}/sales`) |
| Slug | URL-friendly identifier produk/kategori |

---

## 19. Checklists untuk AI Agents

### Saat menambah produk baru:
- [ ] Buat migration jika perlu kolom baru
- [ ] Update model `Product` jika ada relasi baru
- [ ] Update `InitialDataSeeder` untuk data default
- [ ] Update admin form (`AdminProduct.jsx`)
- [ ] Update admin list (`AdminProducts.jsx`)
- [ ] Test di halaman publik (`ProductDetail.jsx`)
- [ ] Pastikan `sold_count` dan `featured` berfungsi

### Saat menambah halaman baru:
- [ ] Buat route di `routes/web.php`
- [ ] Buat controller method
- [ ] Buat page component di `resources/js/Pages/`
- [ ] Buat CSS companion file jika perlu
- [ ] Register layout (MainLayout, AdminLayout, dll)
- [ ] Update navigation jika perlu
- [ ] Test responsive behavior
- [ ] Tambahkan Meta Pixel event jika relevan

### Saat mengubah alur transaksi:
- [ ] Cek `CheckoutController.php`
- [ ] Cek `MidtransWebhookController.php`
- [ ] Cek `AdminTransactionController.php`
- [ ] Cek `TransactionFinalizer.php`
- [ ] Pastikan idempotensi terjaga
- [ ] Test dengan kedua metode (Midtrans + manual)
- [ ] Cek email receipt dikirim
- [ ] Cek Meta CAPI Purchase event
- [ ] Update `docs/ALUR_TRANSAKSI.md`

### Saat mengubah payment flow:
- [ ] Cek validasi harga di `CheckoutController`
- [ ] Cek `PaymentMethod` model
- [ ] Cek admin payment page (`AdminPayment.jsx`)
- [ ] Test dengan metode aktif dan nonaktif
- [ ] Pastikan sentinel `account_number === '-'` untuk Midtrans masih berfungsi

---

*Document terakhir diperbarui: 3 September 2026*
*Project: JAGGAD ACADEMY — Platform Edukasi Digital Indonesia*
