FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl wget

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
ENV ENCRYPTION_KEY="buildtimedummykey1234567890abcdef"
RUN NODE_OPTIONS="--max-old-space-size=2048" ./node_modules/.bin/next build --no-lint
ENV DATABASE_URL=""
ENV ENCRYPTION_KEY=""

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /app/storage/videos /app/storage/thumbnails /app/storage/uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=90s \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>&1 || true; ./node_modules/.bin/next start -p ${PORT:-3000}"]
