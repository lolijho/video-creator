-- CreateTable
CREATE TABLE "VideoJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "parameters" JSONB NOT NULL,
    "inputImageUrl" TEXT,
    "inputVideoUrl" TEXT,
    "outputUrl" TEXT,
    "thumbnailUrl" TEXT,
    "apiTaskId" TEXT,
    "apiVideoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "generationMs" INTEGER,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "apifreeKeyEnc" TEXT,
    "defaultT2VModel" TEXT NOT NULL DEFAULT 'veo-3-fast',
    "defaultI2VModel" TEXT NOT NULL DEFAULT 'veo-2',
    "defaultV2VModel" TEXT NOT NULL DEFAULT 'kling-v1.6-standard',
    "storageType" TEXT NOT NULL DEFAULT 'local',
    "storagePath" TEXT NOT NULL DEFAULT '/app/storage',
    "s3Bucket" TEXT,
    "s3Region" TEXT,
    "s3Endpoint" TEXT,
    "s3AccessKey" TEXT,
    "s3SecretKeyEnc" TEXT,
    "maxUploadMb" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" JSONB NOT NULL,
    "provider" TEXT,
    "metadata" JSONB,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CachedModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoJob_status_idx" ON "VideoJob"("status");

-- CreateIndex
CREATE INDEX "VideoJob_createdAt_idx" ON "VideoJob"("createdAt");

-- CreateIndex
CREATE INDEX "VideoJob_type_idx" ON "VideoJob"("type");
