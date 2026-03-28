# AI Video Generator

Professional full-stack web application for AI video generation using Veo 3, Kling, and other models via [apifree.ai](https://www.apifree.ai).

## Features

- **Text to Video** - Generate videos from text prompts with multiple AI models
- **Image to Video** - Animate images with motion and style control
- **Video Remodel** - Transform existing videos with style transfer
- **Gallery** - Browse, preview, and download generated videos
- **Job Queue** - Real-time progress tracking with automatic polling
- **Multi-Model Support** - Veo 3, Kling, MiniMax, Luma, WAN, and more
- **Dark Cinematic UI** - Premium dark theme with glassmorphism effects

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM, BullMQ + Redis
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Docker Compose, Coolify-ready

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev

# In a separate terminal, start the worker
npm run worker
```

### Mock Mode

Set `MOCK_MODE=true` in `.env` to develop without an API key. The app will simulate video generation with sample videos.

## Docker Deployment

### Build and run locally

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env - set POSTGRES_PASSWORD, ENCRYPTION_KEY, and optionally APIFREE_API_KEY

# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f app
```

The app will be available at `http://localhost:3000`.

### Deploy on Coolify

1. **Create a new project** in Coolify
2. **Add a new service** → Docker Compose
3. **Connect your Git repository** or paste the docker-compose.yml
4. **Set environment variables**:
   - `POSTGRES_PASSWORD` - Strong password for PostgreSQL
   - `ENCRYPTION_KEY` - Generate with `openssl rand -hex 16`
   - `APIFREE_API_KEY` - Your API key from [apifree.ai dashboard](https://www.apifree.ai/dashboard)
   - `MOCK_MODE` - Set to `false` for production
5. **Configure domain** and SSL in Coolify
6. **Deploy** - Coolify will build and start all services

### Getting an API Key

1. Go to [apifree.ai](https://www.apifree.ai)
2. Create an account or sign in
3. Navigate to the Dashboard
4. Generate a new API key
5. Copy the key and add it to your `.env` file or Settings page

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APIFREE_API_KEY` | ApiFree.ai API key | - |
| `APIFREE_BASE_URL` | API base URL | `https://api.apifree.ai/v1` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `ENCRYPTION_KEY` | 32 hex chars for AES-256 encryption | - |
| `STORAGE_PATH` | Local video storage path | `/app/storage` |
| `MOCK_MODE` | Enable mock mode for development | `false` |
| `POSTGRES_PASSWORD` | PostgreSQL password (Docker) | `changeme` |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/generate/text2video` | Submit text-to-video job |
| POST | `/api/generate/image2video` | Submit image-to-video job |
| POST | `/api/generate/video2video` | Submit video-to-video job |
| GET | `/api/jobs` | List jobs with filters |
| GET | `/api/jobs/[id]` | Get job details |
| DELETE | `/api/jobs/[id]` | Delete a job |
| POST | `/api/jobs/[id]/retry` | Retry a failed job |
| GET | `/api/models` | List available models |
| POST | `/api/enhance-prompt` | Enhance prompt with AI |
| GET | `/api/gallery` | List completed videos |
| GET | `/api/video/[id]/download` | Download video file |
| GET/POST | `/api/settings` | Read/update settings |
| GET | `/api/health` | Health check |

## License

MIT
