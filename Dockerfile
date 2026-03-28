FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl wget

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

COPY . .

RUN mkdir -p /app/storage/videos /app/storage/thumbnails /app/storage/uploads

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

# NO HEALTHCHECK - next build at startup needs time

CMD ["sh", "-c", "echo '==> DB sync...' && npx prisma db push --accept-data-loss 2>&1 || true; echo '==> Building...' && ENCRYPTION_KEY=${ENCRYPTION_KEY:-dummykey1234567890abcdef12345678} DATABASE_URL=${DATABASE_URL:-postgresql://x:x@localhost/x} ./node_modules/.bin/next build --no-lint 2>&1; echo '==> Starting...' && exec ./node_modules/.bin/next start -p ${PORT:-3000}"]
