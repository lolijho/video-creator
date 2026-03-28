#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss

echo "Starting Next.js server..."
exec node server.js
