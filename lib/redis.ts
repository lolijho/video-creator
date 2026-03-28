import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: IORedis };

function createRedisConnection(): IORedis {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const conn = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy(times: number) {
      if (times > 20) return null;
      return Math.min(times * 500, 10000);
    },
  });

  // Prevent unhandled error crashes
  conn.on("error", (err) => {
    console.warn("[Redis] Connection error:", err.message);
  });

  return conn;
}

export const redis = globalForRedis.redis || createRedisConnection();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export function createNewRedisConnection(): IORedis {
  return createRedisConnection();
}
