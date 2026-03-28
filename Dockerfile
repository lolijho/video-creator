FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl wget
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN mkdir -p /app/storage/videos /app/storage/thumbnails /app/storage/uploads

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=60s \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["./docker-entrypoint.sh"]
