#!/bin/sh

echo "==> Waiting for database..."
for i in $(seq 1 30); do
  if node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.\$queryRaw\`SELECT 1\`.then(() => { p.\$disconnect(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "==> Database is ready"
    break
  fi
  echo "    Attempt $i/30 - waiting..."
  sleep 2
done

echo "==> Running database migrations..."
npx prisma db push --accept-data-loss 2>&1 || echo "Warning: db push failed, continuing..."

echo "==> Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
