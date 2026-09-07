#!/usr/bin/env bash
set -Eeuo pipefail

echo "🚀 Memulai deployment JAGGAD Academy..."

# 1. In-place deploy harus berhenti melayani traffic sebelum source/dependency berubah.
echo "🔒 Mengaktifkan maintenance mode..."
php artisan down --retry=60

# 2. Install, build, dan verifikasi release.
echo "📦 Menginstall dependensi Composer untuk verifikasi..."
composer install --prefer-dist --optimize-autoloader --no-interaction

echo "📦 Menginstall dependensi npm..."
npm ci

echo "🔨 Menjalankan build frontend (Vite)..."
npm run build

echo "🧪 Menjalankan automated regression tests..."
php artisan optimize:clear
php artisan test

echo "📦 Membuang dependensi development..."
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

# 3. Database migrations & storage link
echo "🗄️ Menjalankan migrasi database..."
php artisan migrate --force

echo "🔗 Memastikan storage symlink..."
if [ ! -L public/storage ]; then
    php artisan storage:link
fi

# 4. Optimasi cache Laravel (config, routes, views)
echo "⚡ Mengoptimalkan cache..."
php artisan optimize

# 5. Restart queue worker bila queue berjalan
echo "🔄 Merestart queue worker..."
php artisan queue:restart

# 6. Selesai dan buka kembali aplikasi
echo "🔓 Menonaktifkan maintenance mode..."
php artisan up

echo "✅ Deployment JAGGAD Academy selesai dengan sukses!"
