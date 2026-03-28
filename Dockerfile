FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl wget

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client (no DB connection needed)
RUN npx prisma generate

COPY . .

# Build Next.js - unset any DATABASE_URL from build args, increase memory
ENV NEXT_TELEMETRY_DISABLED=1
ARG DATABASE_URL
RUN unset DATABASE_URL && \
    export DATABASE_URL="postgresql://build:build@localhost:5432/build" && \
    export NODE_OPTIONS="--max-old-space-size=4096" && \
    npx next build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /app/storage/videos /app/storage/thumbnails /app/storage/uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=90s \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>&1 || true; node node_modules/next/dist/bin/next start -p ${PORT:-3000}"]
