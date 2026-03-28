# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl wget
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create storage directory
RUN mkdir -p /app/storage/videos /app/storage/thumbnails /app/storage/uploads

# 1) Copy standalone output first (includes server.js, .next/server, minimal node_modules)
COPY --from=builder /app/.next/standalone ./

# 2) Copy static assets and public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 3) Overlay full node_modules on top (for prisma CLI, sharp, etc.)
COPY --from=builder /app/node_modules ./node_modules

# 4) Copy prisma schema (for db push)
COPY --from=builder /app/prisma ./prisma

# 5) Entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=60s \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["./docker-entrypoint.sh"]
