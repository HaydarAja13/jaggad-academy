#!/usr/bin/env bash
set -Eeuo pipefail

# Skrip backup otomatis database dan file upload untuk JAGGAD Academy
# Simpan di cron harian: 0 2 * * * /var/www/jaggad/scripts/backup.sh

BACKUP_DIR="${BACKUP_DIR:-/var/backups/jaggad}"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

read_env() {
    local value
    value=$(grep -m1 -E "^${1}=" "${PROJECT_DIR}/.env" | cut -d '=' -f2- || true)
    value="${value%$'\r'}"
    if [[ "$value" == \"*\" || "$value" == \'*\' ]]; then
        value="${value:1:-1}"
    fi
    printf '%s' "$value"
}

mkdir -p "${BACKUP_DIR}/db"
mkdir -p "${BACKUP_DIR}/storage"

echo "📦 Memulai backup JAGGAD Academy [${DATE}]..."

# 1. Backup Database (MySQL jika dikonfigurasi, atau SQLite jika lokal)
if [ -f "${PROJECT_DIR}/.env" ]; then
    DB_CONN=$(read_env DB_CONNECTION)
    DB_NAME=$(read_env DB_DATABASE)
    DB_USER=$(read_env DB_USERNAME)
    DB_PASS=$(read_env DB_PASSWORD)
    DB_HOST=$(read_env DB_HOST)
    DB_PORT=$(read_env DB_PORT)

    if [ "$DB_CONN" = "mysql" ]; then
        echo "💾 Dumping MySQL database ${DB_NAME}..."
        MYSQL_PWD="${DB_PASS}" mysqldump --single-transaction --quick --lock-tables=false -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_DIR}/db/db_${DATE}.sql.gz"
        gzip -t "${BACKUP_DIR}/db/db_${DATE}.sql.gz"
    elif [ "$DB_CONN" = "sqlite" ]; then
        SQLITE_PATH="${DB_NAME:-database/database.sqlite}"
        if [[ "$SQLITE_PATH" != /* ]]; then
            SQLITE_PATH="${PROJECT_DIR}/${SQLITE_PATH}"
        fi
        if [ ! -f "$SQLITE_PATH" ]; then
            echo "❌ Database SQLite tidak ditemukan." >&2
            exit 1
        fi
        echo "💾 Salin SQLite database..."
        sqlite3 "$SQLITE_PATH" ".backup '${BACKUP_DIR}/db/sqlite_${DATE}.db'"
        gzip "${BACKUP_DIR}/db/sqlite_${DATE}.db"
        gzip -t "${BACKUP_DIR}/db/sqlite_${DATE}.db.gz"
    else
        echo "❌ DB_CONNECTION '${DB_CONN}' belum didukung skrip backup." >&2
        exit 1
    fi
else
    echo "❌ File .env tidak ditemukan; backup dibatalkan." >&2
    exit 1
fi

# 2. Backup seluruh upload storage, termasuk bukti pembayaran private.
if [ -d "${PROJECT_DIR}/storage/app" ]; then
    echo "🗂️ Mengarsipkan upload storage..."
    tar -czf "${BACKUP_DIR}/storage/storage_${DATE}.tar.gz" -C "${PROJECT_DIR}/storage/app" .
    tar -tzf "${BACKUP_DIR}/storage/storage_${DATE}.tar.gz" >/dev/null
fi

# 3. Retention policy: Hapus backup yang lebih lama dari 30 hari
echo "🧹 Membersihkan backup lama (>30 hari)..."
find "${BACKUP_DIR}/db" -type f -mtime +30 -delete
find "${BACKUP_DIR}/storage" -type f -mtime +30 -delete

echo "✅ Backup selesai: disimpan di ${BACKUP_DIR}"
