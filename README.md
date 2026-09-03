# JAGGAD ACADEMY - Platform Edukasi Digital

Platform edukasi digital modern yang dibangun menggunakan ekosistem **Laravel 12** + **React (Inertia.js)**. Dilengkapi dengan integrasi Midtrans Payment Gateway, Google OAuth, Meta Pixel, dan sistem CMS Admin yang lengkap.

## 🚀 Tech Stack

| Layer | Teknologi |
|---|---|
| **Backend** | Laravel 12 (PHP 8.2+) |
| **Frontend** | React 18 + Inertia.js |
| **Styling** | Custom Vanilla CSS |
| **Database** | MySQL (Produksi) / SQLite (Lokal) |
| **Payment** | Midtrans (QRIS, VA, Kartu, E-wallet) |
| **Auth** | Session + Google OAuth (Socialite) |
| **Analytics** | Meta Pixel + Conversions API (Server-Side) |
| **Build** | Vite + fast-glob (per-page CSS splitting) |

---

## 🛠️ Setup Lokal (Development)

### Prasyarat
- PHP >= 8.2
- Composer
- Node.js >= 18 & NPM
- Database Server (MySQL atau SQLite)

### Langkah-langkah:

```bash
# 1. Clone repository
git clone <repository-url>
cd edutech

# 2. Instal dependensi PHP
composer install

# 3. Instal dependensi Node.js
npm install

# 4. Salin & konfigurasi environment
cp .env.example .env
php artisan key:generate

# 5. Set database di .env, lalu jalankan migrasi + seeder
php artisan migrate
php artisan db:seed --class=InitialDataSeeder

# 6. Buat symlink storage
php artisan storage:link

# 7. Jalankan server (dua terminal terpisah)
php artisan serve
npm run dev
```

**Akun default setelah seeder:**
| Email | Password | Role |
|---|---|---|
| `admin@jaggad.id` | `password` | Admin |
| `user@gmail.com` | `password` | Customer |

---

## 🌐 Panduan Deployment (Produksi)

### 1. Persyaratan Server
- PHP >= 8.2 dengan ekstensi: `curl`, `mbstring`, `openssl`, `pdo`, `tokenizer`, `xml`
- Composer & Node.js >= 18
- Web server: **Nginx** atau Apache
- Document Root diarahkan ke folder `/public`

---

### 2. Upload Kode ke Server
```bash
# Clone atau pull dari repository
git clone <repository-url> /var/www/jaggad
# atau jika sudah ada:
git pull origin main
```

---

### 3. Konfigurasi File `.env`

Buat file `.env` di server dan isi nilai berikut:

```env
APP_NAME="JAGGAD ACADEMY"
APP_ENV=production
APP_KEY=           # Di-generate otomatis oleh artisan
APP_DEBUG=false
APP_URL=https://domain-anda.com

# Database (WAJIB - ganti ke MySQL di produksi)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=jaggad_db
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# Session & Cache
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync

# Storage (agar URL aset benar)
FILESYSTEM_DISK=public
```

> [!IMPORTANT]
> **Jangan isi Midtrans/Google/Meta Key di `.env`**. Semua kredensial dikelola lewat **Dashboard Admin › Settings** agar bisa diubah tanpa deploy ulang.

---

### 4. Instal Dependensi & Build Aset

```bash
cd /var/www/jaggad

# Instal PHP dependencies (tanpa dev tools)
composer install --no-dev --optimize-autoloader

# Instal Node.js dependencies
npm install

# Build aset frontend untuk produksi
npm run build
```

---

### 5. Generate Key & Setup Database

```bash
# Generate application key
php artisan key:generate

# Jalankan semua migrasi
php artisan migrate --force

# Isi data awal (kategori, produk, metode bayar, admin, dll)
php artisan db:seed --class=InitialDataSeeder

# Buat symlink untuk storage publik
php artisan storage:link
```

---

### 6. Konfigurasi Izin Folder

```bash
# Berikan izin tulis pada folder yang dibutuhkan Laravel
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data /var/www/jaggad
```

---

### 7. Optimasi Cache Laravel

```bash
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

---

### 8. Konfigurasi Nginx (Contoh)

```nginx
server {
    listen 80;
    server_name domain-anda.com;
    root /var/www/jaggad/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    # Izinkan upload sampai 7MB
    client_max_body_size 7M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

## 💳 Konfigurasi Midtrans (Step-by-Step)

### Di Dashboard Midtrans

1. Login ke [dashboard.midtrans.com](https://dashboard.midtrans.com) (Production) atau [sandbox.midtrans.com](https://sandbox.midtrans.com) (Testing)
2. Buka **Settings › Configuration**
3. Isi bagian **Notification URL** (Webhook):
   ```
   https://domain-anda.com/midtrans/webhook
   ```
4. Isi bagian **Redirect URL** (opsional, sebagai fallback):
   - **Finish Redirect URL:** `https://domain-anda.com/dashboard`
   - **Unfinish Redirect URL:** `https://domain-anda.com/dashboard`
   - **Error Redirect URL:** `https://domain-anda.com/checkout`
5. Klik **Save**
6. Salin **Server Key** dan **Client Key** dari halaman **Settings › Access Keys**

### Di Admin Panel Jaggad Academy

1. Login sebagai Admin (`admin@jaggad.id`)
2. Buka **Settings** di sidebar Admin
3. Pada bagian **Midtrans Payment Gateway**:
   - Isi **Midtrans Server Key** (contoh: `Mid-server-xxxx` atau `SB-Mid-server-xxxx` untuk sandbox)
   - Isi **Midtrans Client Key** (contoh: `Mid-client-xxxx` atau `SB-Mid-client-xxxx` untuk sandbox)
   - Toggle **Production Mode**: `OFF` untuk Sandbox, `ON` untuk Production
4. Klik **Simpan Pengaturan**

> [!NOTE]
> Sistem menggunakan **self-healing**: begitu Midtrans Client Key terdeteksi terisi, sistem akan **otomatis** membuat entri Midtrans di daftar metode pembayaran. Anda tidak perlu input manual ke tabel Payment Methods.

> [!IMPORTANT]
> URL Webhook **wajib HTTPS** dan dapat diakses secara publik. Jika testing lokal, gunakan [ngrok](https://ngrok.com): `ngrok http 8000` lalu gunakan URL ngrok sebagai webhook.

---

## 📊 Konfigurasi Meta Pixel (Step-by-Step)

Meta Pixel digunakan untuk melacak pengunjung dan konversi penjualan secara otomatis, termasuk **Server-Side Tracking** via Conversions API yang terhubung langsung ke data transaksi Midtrans.

### Event yang Dilacak Otomatis

| Event | Kapan Terjadi | Data yang Dikirim |
|---|---|---|
| `PageView` | Setiap halaman dibuka / navigasi | — |
| `ViewContent` | Halaman detail produk | ID, nama, harga produk |
| `InitiateCheckout` | User klik tombol bayar | Total nilai, jumlah item |
| `Purchase` | Setelah pembayaran sukses terverifikasi | Revenue asli, order ID, daftar produk |

> [!NOTE]
> Event `Purchase` dikirim dua kali: dari **browser (Client-Side)** sesaat setelah pop-up Midtrans ditutup, dan dari **server (Server-Side via Conversions API)** saat webhook Midtrans diterima. Ini memastikan tidak ada transaksi yang terlewat.

### Langkah Setup Pixel ID

1. Login ke [business.facebook.com](https://business.facebook.com)
2. Masuk ke **Events Manager**
3. Klik **+ Connect Data Sources** → pilih **Web**
4. Pilih **Meta Pixel** → klik **Connect**
5. Beri nama pixel Anda, klik **Continue**
6. Salin **Pixel ID** (angka 16 digit, contoh: `1234567890123456`)
7. Di Admin Panel Jaggad → **Settings** → isi **Meta Pixel ID** → Simpan

### Langkah Setup Conversions API Token (Server-Side)

> [!IMPORTANT]
> Conversions API memastikan data penjualan **100% terhubung ke data asli Midtrans**, bahkan jika browser user tertutup sebelum redirect.

1. Masuk ke **Events Manager** di Meta Business Manager
2. Klik pixel Anda → buka tab **Settings**
3. Scroll ke bagian **Conversions API**
4. Klik **Generate Access Token**
5. Salin token panjang yang dihasilkan (diawali `EAAB...`)
6. Di Admin Panel Jaggad → **Settings** → isi **Meta Conversions API Token** → Simpan

### Verifikasi Tracking

1. Install ekstensi [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/) di Chrome
2. Buka website Jaggad, ikon Pixel Helper akan menjadi hijau jika tracking aktif
3. Atau buka **Events Manager → Test Events** di Meta Business Manager untuk melihat event real-time

---

## 🔄 Update Kode (setelah deploy awal)

```bash
git pull origin main
composer install --no-dev --optimize-autoloader
npm install && npm run build
php artisan migrate --force
php artisan optimize
```

---

## 🚑 Troubleshooting

| Masalah | Solusi |
|---|---|
| **Tampilan rusak saat refresh** | Pastikan `npm run build` sudah dijalankan ulang setelah pull |
| **Produk 404 saat diklik** | Jalankan perintah fix slug di bawah |
| **413 Entity Too Large saat upload** | Atur `client_max_body_size 7M` di Nginx & `upload_max_filesize = 5M` di PHP |
| **Midtrans belum dikonfigurasi** | Admin → Settings → isi Server Key & Client Key → Simpan |
| **Webhook Midtrans error "Failed to send"** | Pastikan URL `https://domain.com/midtrans/webhook` bisa diakses publik & HTTPS |
| **Gambar produk tidak muncul** | Jalankan `php artisan storage:link` |
| **Meta Pixel tidak tracking** | Pastikan Pixel ID sudah diisi di Admin → Settings. Cek dengan Meta Pixel Helper |
| **Data penjualan tidak masuk Meta** | Pastikan Conversions API Token sudah diisi di Admin → Settings |
| **Error 500 setelah migrate** | `php artisan config:clear && php artisan cache:clear` lalu coba lagi |
| **Google Login tidak berfungsi** | Isi Google Client ID/Secret di Admin → Settings, verifikasi redirect URL di Google Cloud Console |

### 🛠 Fix Slug Produk (404 pada produk lama)

```bash
php artisan tinker --execute="App\Models\Product::all()->each(function(\$p) { if(empty(\$p->slug)) { \$p->slug = Illuminate\Support\Str::slug(\$p->name); \$p->saveQuietly(); echo 'Fixed: '.\$p->name.PHP_EOL; } });"
```

### 🛠 Tambah meta_pixel_id ke Settings yang Sudah Ada

Jika server sudah live tanpa fresh seed, jalankan ini untuk menambahkan key Meta Pixel ke data settings:

```bash
php artisan tinker --execute="
\$s = App\Models\SiteContent::where('key','site_settings')->first();
\$d = json_decode(\$s->value, true);
\$d['meta_pixel_id'] = \$d['meta_pixel_id'] ?? '';
\$d['meta_access_token'] = \$d['meta_access_token'] ?? '';
\$s->update(['value' => json_encode(\$d)]);
echo 'Done';
"
```

### 🛠 Fix 413 Entity Too Large (Upload Gambar)

#### Nginx — tambahkan di dalam `server { }` block:
```nginx
client_max_body_size 7M;
```
```bash
sudo nginx -t && sudo systemctl restart nginx
```

#### PHP-FPM — edit `/etc/php/8.2/fpm/php.ini`:
```ini
upload_max_filesize = 5M
post_max_size = 6M
max_execution_time = 120
memory_limit = 256M
```
```bash
sudo systemctl restart php8.2-fpm
```

---

## 📁 Struktur Direktori Penting

```
├── app/
│   ├── Http/Controllers/
│   │   ├── Admin/                          # Logika panel admin
│   │   ├── CheckoutController.php          # Alur pembayaran Midtrans
│   │   └── MidtransWebhookController.php   # Handler webhook + Meta CAPI
│   ├── Models/
│   └── Http/Middleware/HandleInertiaRequests.php  # Share data global ke React
├── database/
│   ├── migrations/
│   └── seeders/InitialDataSeeder.php       # Data awal aplikasi
├── resources/js/
│   ├── Pages/                              # Komponen halaman React
│   ├── Layouts/                            # Layout utama
│   ├── Utils/useMetaPixel.js               # Hook tracking Meta Pixel
│   └── Styles/Global.css                  # CSS global (diload di semua halaman)
├── routes/web.php                          # Semua rute aplikasi
└── vite.config.js                          # Build config (per-page CSS splitting)
```

---

## 🛡️ Catatan Keamanan

- **Jangan commit `.env`** ke repository publik — sudah di-exclude di `.gitignore`
- **APP_DEBUG=false** wajib di produksi untuk mencegah kebocoran informasi sensitif
- **Kredensial API** (Midtrans, Google, Meta) dikelola via database Admin, bukan file `.env`
- **Webhook Midtrans** diverifikasi menggunakan SHA512 signature key secara otomatis
- **Data user di Meta CAPI** dikirim dalam bentuk hash SHA256 (email & nomor HP tidak pernah dikirim plain text)

---

*Dikembangkan oleh **JAGGAD ACADEMY Team** | Terakhir diperbarui: 20 Maret 2026*
