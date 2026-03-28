import { Queue } from "bullmq";
import { createNewRedisConnection } from "./redis";

let videoQueue: Queue | null = null;

function getQueue(): Queue | null {
  if (videoQueue) return videoQueue;

  try {
    videoQueue = new Queue("video-polling", {
      connection: createNewRedisConnection(),
      defaultJobOptions: {
        attempts: 360,
        backoff: { type: "fixed", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
    return videoQueue;
  } catch (err) {
    console.warn("[Queue] Failed to create queue:", (err as Error).message);
    return null;
  }
}

export async function addPollingJob(jobId: string, taskId: string) {
  const queue = getQueue();
  if (!queue) {
    console.warn("[Queue] Queue not available, skipping polling job for", jobId);
    return;
  }

  await queue.add(
    "poll-video",
    { jobId, taskId, startedAt: Date.now() },
    { jobId: `poll-${jobId}` }
  );
}
