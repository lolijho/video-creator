#!/bin/sh

echo "==> Checking server.js exists..."
ls -la /app/server.js || { echo "ERROR: server.js not found!"; exit 1; }

echo "==> Checking .next directory..."
ls /app/.next/server/ | head -5

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
  if [ "$i" = "30" ]; then
    echo "WARNING: Database not ready after 30 attempts, starting anyway..."
  fi
  sleep 2
done

echo "==> Running prisma db push..."
npx prisma db push --accept-data-loss 2>&1 || echo "WARNING: prisma db push had issues"

echo "==> Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
