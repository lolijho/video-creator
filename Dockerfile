FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl wget

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

COPY . .

# Build Next.js - all API routes are force-dynamic so no DB/Redis needed
ENV NEXT_TELEMETRY_DISABLED=1
ENV ENCRYPTION_KEY="buildtimedummykey1234567890abcdef"
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
RUN ./node_modules/.bin/next build --no-lint
ENV ENCRYPTION_KEY=""
ENV DATABASE_URL=""

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /app/storage/videos /app/storage/thumbnails /app/storage/uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>&1 || true; exec ./node_modules/.bin/next start -p ${PORT:-3000}"]
