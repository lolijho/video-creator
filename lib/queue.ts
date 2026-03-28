import { Queue } from "bullmq";
import { createNewRedisConnection } from "./redis";

const globalForQueue = globalThis as unknown as { videoQueue: Queue };

export const videoQueue =
  globalForQueue.videoQueue ||
  new Queue("video-polling", {
    connection: createNewRedisConnection(),
    defaultJobOptions: {
      attempts: 360,
      backoff: {
        type: "fixed",
        delay: 5000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  });

if (process.env.NODE_ENV !== "production") globalForQueue.videoQueue = videoQueue;

export async function addPollingJob(jobId: string, taskId: string) {
  await videoQueue.add(
    "poll-video",
    { jobId, taskId, startedAt: Date.now() },
    { jobId: `poll-${jobId}` }
  );
}
