FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl wget

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

COPY . .

# Coolify injects ARG DATABASE_URL - override it for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN ./node_modules/.bin/next build
# Unset so runtime uses the real one from Coolify
ENV DATABASE_URL=""
ENV NODE_OPTIONS=""

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /app/storage/videos /app/storage/thumbnails /app/storage/uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=90s \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>&1 || true; ./node_modules/.bin/next start -p ${PORT:-3000}"]
