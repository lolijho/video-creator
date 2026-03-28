import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { ApifreeClient } from "../apifree";
import { saveVideoFromUrl } from "../storage";
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

  // Step 2: Check status
  const statusResult = await client.getTaskStatus(taskId);

  if (statusResult.status === "queued" || statusResult.status === "processing" || statusResult.status === "pending") {
    await prisma.videoJob.update({
      where: { id: jobId },
      data: { status: statusResult.status === "pending" ? "queued" : statusResult.status },
    });
    // Throw to retry with backoff
    throw new Error(`Still ${statusResult.status}, will retry`);
  }

  if (statusResult.status === "success" || statusResult.status === "completed") {
    const generationMs = Date.now() - startedAt;

    // Step 3: Get result
    const result = await client.getTaskResult(taskId);

    let outputUrl = result.video_url;
    let fileSize = 0;

    try {
      const saved = await saveVideoFromUrl(result.video_url, jobId);
      outputUrl = saved.localPath;
      fileSize = saved.fileSize;
    } catch (err) {
      console.error("Failed to save video locally, using API URL:", err);
    }

    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        outputUrl,
        apiVideoUrl: result.video_url,
        generationMs,
        fileSizeBytes: fileSize || null,
      },
    });
    return;
  }

  if (statusResult.status === "failed" || statusResult.status === "error") {
    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: "Generation failed",
      },
    });
    return;
  }

  // Unknown status, retry
  throw new Error(`Unknown status: ${statusResult.status}`);
}

function startWorker() {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  connection.on("error", (err) => {
    console.warn("[Worker Redis] Connection error:", err.message);
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

if (require.main === module) {
  startWorker();
}

export { startWorker };
