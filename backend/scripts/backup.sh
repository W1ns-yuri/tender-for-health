#!/usr/bin/env bash
# Ежедневный бэкап PostgreSQL. Пример для cron (каждый день в 03:30):
#   30 3 * * * cd /srv/tender/backend && ./scripts/backup.sh >> /var/log/tender-backup.log 2>&1
#
# Берёт DATABASE_URL из окружения или из backend/.env, кладёт сжатый дамп в BACKUP_DIR
# и удаляет дампы старше BACKUP_KEEP_DAYS. Восстановление:
#   gunzip -c tender_YYYYmmdd_HHMMSS.sql.gz | psql "$DATABASE_URL"
# Хранить копии стоит ещё и вне сервера (другой диск/облако), иначе умрут вместе с сервером.
set -euo pipefail

cd "$(dirname "$0")/.."
if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')"
fi
: "${DATABASE_URL:?DATABASE_URL не задан}"

# pg_dump не понимает параметр ?schema=public из строки Prisma
DB_URL="${DATABASE_URL%%\?*}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

FILE="$BACKUP_DIR/tender_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump --no-owner --no-privileges "$DB_URL" | gzip > "$FILE"
echo "$(date -Is) backup ok: $FILE ($(du -h "$FILE" | cut -f1))"

find "$BACKUP_DIR" -name 'tender_*.sql.gz' -mtime +"$BACKUP_KEEP_DAYS" -delete
