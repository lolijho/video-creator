import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { ApifreeClient } from "../apifree";
import { saveVideoFromUrl, saveThumbnail } from "../storage";
import { decrypt } from "../crypto";
import IORedis from "ioredis";

const prisma = new PrismaClient();

interface PollJobData {
  jobId: string;
  taskId: string;
  startedAt: number;
}

const MAX_POLL_DURATION_MS = 30 * 60 * 1000; // 30 minutes

async function getApiKey(): Promise<string> {
  if (process.env.APIFREE_API_KEY) return process.env.APIFREE_API_KEY;

  const settings = await prisma.appSettings.findUnique({
    where: { id: "main" },
  });

  if (settings?.apifreeKeyEnc) {
    return decrypt(settings.apifreeKeyEnc);
  }

  throw new Error("No API key configured");
}

async function processPollJob(job: Job<PollJobData>): Promise<void> {
  const { jobId, taskId, startedAt } = job.data;

  const elapsed = Date.now() - startedAt;
  if (elapsed > MAX_POLL_DURATION_MS) {
    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: "Generation timed out after 30 minutes",
      },
    });
    return;
  }

  const videoJob = await prisma.videoJob.findUnique({ where: { id: jobId } });
  if (!videoJob || videoJob.status === "completed" || videoJob.status === "failed") {
    return;
  }

  const apiKey = await getApiKey();
  const client = new ApifreeClient(apiKey);

  const status = await client.getTaskStatus(taskId);

  if (status.status === "queued" || status.status === "processing") {
    await prisma.videoJob.update({
      where: { id: jobId },
      data: { status: status.status },
    });
    // Throw to retry with backoff
    throw new Error(`Still ${status.status}, will retry`);
  }

  if (status.status === "completed" && status.video_url) {
    const generationMs = Date.now() - startedAt;

    let outputUrl = status.video_url;
    let fileSize = 0;

    try {
      const saved = await saveVideoFromUrl(status.video_url, jobId);
      outputUrl = saved.localPath;
      fileSize = saved.fileSize;
    } catch (err) {
      console.error("Failed to save video locally, using API URL:", err);
    }

    let thumbnailUrl = status.thumbnail_url || null;
    if (thumbnailUrl) {
      try {
        thumbnailUrl = await saveThumbnail(thumbnailUrl, jobId);
      } catch {
        // Keep original URL
      }
    }

    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        outputUrl,
        apiVideoUrl: status.video_url,
        thumbnailUrl,
        generationMs,
        fileSizeBytes: fileSize || null,
      },
    });
    return;
  }

  if (status.status === "failed") {
    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: status.error || "Generation failed",
      },
    });
    return;
  }

  // Unknown status, retry
  throw new Error(`Unknown status: ${status.status}`);
}

function startWorker() {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const worker = new Worker("video-polling", processPollJob, {
    connection,
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 5000,
    },
  });

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    if (job && job.attemptsMade < (job.opts.attempts || 360)) {
      // Expected retry, don't log as error
      return;
    }
    console.error(`[Worker] Job ${job?.id} failed permanently:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Worker] Error:", err);
  });

  console.log("[Worker] Video polling worker started");
  return worker;
}

// Auto-start when imported directly
if (require.main === module) {
  startWorker();
}

export { startWorker };
