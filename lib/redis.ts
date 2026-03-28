import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: IORedis };

function createRedisConnection(): IORedis {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
  });
}

export const redis = globalForRedis.redis || createRedisConnection();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export function createNewRedisConnection(): IORedis {
  return createRedisConnection();
}
