#!/bin/bash

# Ensure script halts on errors
set -e

# Configuration
BACKUP_DIR="/home/paras/Code/Backup/caliber-link-auto"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/home/paras/Code/caliber-link"
TEMP_DIR="/tmp/caliber-backup-$TIMESTAMP"

echo "Starting automated backup for Caliber Link ecosystem..."

# Create backup directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$TEMP_DIR"

# 1. Backup Caliber Link SQLite Database
echo "Copying SQLite database..."
mkdir -p "$TEMP_DIR/caliber-db"
cp "$PROJECT_DIR/server/db/data.db" "$TEMP_DIR/caliber-db/" || echo "No SQLite DB found, skipping."

# 2. Backup Uploaded Assets
echo "Copying public assets..."
mkdir -p "$TEMP_DIR/assets"
if [ -d "$PROJECT_DIR/assets" ]; then
    cp -r "$PROJECT_DIR/assets/"* "$TEMP_DIR/assets/"
else
    echo "No assets directory found, skipping."
fi

# 3. Backup Invoice Ninja MariaDB
echo "Skipping Invoice Ninja database dump."

# 4. Zip it all up
echo "Compressing backup..."
cd "$TEMP_DIR"
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" .

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Backup complete: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

# Optional: keep only last 7 backups
ls -1tr "$BACKUP_DIR"/backup_*.tar.gz | head -n -7 | xargs -d '\n' rm -f -- 2>/dev/null || true
