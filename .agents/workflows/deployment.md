---
description: SAGA Academy Deployment & Data Synchronization
---

// turbo-all
# Deployment Workflow

Follow ini langkah-langkah deployment atau reset aplikasi untuk memastikan data (kategori, produk, slug, dan metrik penjualan) terinisialisasi dengan benar dan sesuai data riil.

## 1. Persiapan Environment
Pastikan file `.env` sudah dikonfigurasi dengan database, storage link, dan pengaturan Inertia/Vite yang benar.

## 2. Instalasi Dependensi
```bash
composer install --no-dev --optimize-autoloader
npm install --no-save
npm run build
```

## 3. Inisialisasi Database (Install Baru)
Jika instalasi pertama kali, jalankan:
```bash
php artisan migrate --force
php artisan db:seed --class=InitialDataSeeder
php artisan storage:link
```
*Catatan: `InitialDataSeeder` sudah dikonfigurasi untuk memulai `sold_count` dari 0 dan men-generate slug otomatis.*

## 4. Sinkronisasi Data Penjualan Riil
Jika Anda melakukan update pada database yang sudah berisi data transaksi, jalankan perintah ini untuk menghitung ulang angka "Terjual" (sold_count) berdasarkan transaksi yang **sukses**:
```bash
php artisan tinker --execute="foreach(App\Models\Product::all() as \$p) { \$count = App\Models\TransactionItem::where('product_id', \$p->id)->whereHas('transaction', fn(\$q) => \$q->where('status', 'success'))->count(); \$p->update(['sold_count' => \$count]); echo \"Synced: {\$p->name} -> {\$count}\\n\"; }"
```

## 5. Pembersihan Cache
Finalisasi deployment dengan membersihkan seluruh cache Laravel:
```bash
php artisan cache:clear
php artisan route:cache
php artisan config:cache
php artisan view:cache
php artisan optimize
```
