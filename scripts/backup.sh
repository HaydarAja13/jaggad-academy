#!/usr/bin/env bash
set -e

# Skrip backup otomatis database dan file upload untuk JAGGAD Academy
# Simpan di cron harian: 0 2 * * * /var/www/jaggad/scripts/backup.sh

BACKUP_DIR="${BACKUP_DIR:-/var/backups/jaggad}"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "${BACKUP_DIR}/db"
mkdir -p "${BACKUP_DIR}/storage"

echo "📦 Memulai backup JAGGAD Academy [${DATE}]..."

# 1. Backup Database (MySQL jika dikonfigurasi, atau SQLite jika lokal)
if [ -f "${PROJECT_DIR}/.env" ]; then
    DB_CONN=$(grep -E "^DB_CONNECTION=" "${PROJECT_DIR}/.env" | cut -d '=' -f2 | tr -d ' "')
    DB_NAME=$(grep -E "^DB_DATABASE=" "${PROJECT_DIR}/.env" | cut -d '=' -f2 | tr -d ' "')
    DB_USER=$(grep -E "^DB_USERNAME=" "${PROJECT_DIR}/.env" | cut -d '=' -f2 | tr -d ' "')
    DB_PASS=$(grep -E "^DB_PASSWORD=" "${PROJECT_DIR}/.env" | cut -d '=' -f2 | tr -d ' "')
    DB_HOST=$(grep -E "^DB_HOST=" "${PROJECT_DIR}/.env" | cut -d '=' -f2 | tr -d ' "')

    if [ "$DB_CONN" = "mysql" ]; then
        echo "💾 Dumping MySQL database ${DB_NAME}..."
        mysqldump -h "${DB_HOST:-127.0.0.1}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" | gzip > "${BACKUP_DIR}/db/db_${DATE}.sql.gz"
    elif [ "$DB_CONN" = "sqlite" ] || [ -f "${PROJECT_DIR}/database/database.sqlite" ]; then
        echo "💾 Salin SQLite database..."
        sqlite3 "${PROJECT_DIR}/database/database.sqlite" ".backup '${BACKUP_DIR}/db/sqlite_${DATE}.db'"
        gzip "${BACKUP_DIR}/db/sqlite_${DATE}.db"
    fi
fi

# 2. Backup upload storage (storage/app/public)
if [ -d "${PROJECT_DIR}/storage/app/public" ]; then
    echo "🗂️ Mengarsipkan upload storage..."
    tar -czf "${BACKUP_DIR}/storage/storage_${DATE}.tar.gz" -C "${PROJECT_DIR}/storage/app" public
fi

# 3. Retention policy: Hapus backup yang lebih lama dari 30 hari
echo "🧹 Membersihkan backup lama (>30 hari)..."
find "${BACKUP_DIR}/db" -type f -mtime +30 -delete
find "${BACKUP_DIR}/storage" -type f -mtime +30 -delete

echo "✅ Backup selesai: disimpan di ${BACKUP_DIR}"
