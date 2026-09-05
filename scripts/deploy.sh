#!/usr/bin/env bash
set -e

echo "🚀 Memulai deployment JAGGAD Academy..."

# 1. Pastikan dependensi dan build dilakukan sebelum maintenance mode untuk meminimalkan downtime
echo "📦 Menginstall dependensi Composer (no-dev, optimized)..."
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

echo "📦 Menginstall dependensi npm..."
npm ci

echo "🔨 Menjalankan build frontend (Vite)..."
npm run build

echo "🧪 Menjalankan automated regression tests..."
php artisan test

# 2. Masuk maintenance mode
echo "🔒 Mengaktifkan maintenance mode..."
php artisan down || true

# 3. Database migrations & storage link
echo "🗄️ Menjalankan migrasi database..."
php artisan migrate --force

echo "🔗 Memastikan storage symlink..."
php artisan storage:link || true

# 4. Optimasi cache Laravel (config, routes, views)
echo "⚡ Mengoptimalkan cache..."
php artisan optimize

# 5. Restart queue worker bila queue berjalan
echo "🔄 Merestart queue worker..."
php artisan queue:restart || true

# 6. Selesai dan buka kembali aplikasi
echo "🔓 Menonaktifkan maintenance mode..."
php artisan up

echo "✅ Deployment JAGGAD Academy selesai dengan sukses!"
