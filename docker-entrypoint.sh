#!/bin/sh

echo "==> Waiting for database..."
for i in $(seq 1 30); do
  if node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.\$queryRaw\`SELECT 1\`.then(() => { p.\$disconnect(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "==> Database ready"
    break
  fi
  echo "    Waiting... ($i/30)"
  sleep 2
done

echo "==> Running prisma db push..."
npx prisma db push --accept-data-loss 2>&1 || echo "WARNING: prisma db push had issues"

echo "==> Starting Next.js..."
exec npx next start -p ${PORT:-3000}
