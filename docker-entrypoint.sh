#!/bin/sh

echo "==> Starting AI Video Generator"

# Wait for database (max 60s)
echo "==> Waiting for database..."
for i in $(seq 1 30); do
  if npx prisma db push --accept-data-loss 2>&1; then
    echo "==> Database ready and schema synced"
    break
  fi
  echo "    Retry $i/30..."
  sleep 2
done

echo "==> Starting Next.js on port ${PORT:-3000}"
exec npx next start -p ${PORT:-3000} -H 0.0.0.0
