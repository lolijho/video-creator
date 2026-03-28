import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch {
    checks.db = "error";
  }

  let redisOk = false;
  try {
    const { redis } = await import("@/lib/redis");
    const pong = await redis.ping();
    checks.redis = pong === "PONG" ? "ok" : "error";
    redisOk = pong === "PONG";
  } catch {
    checks.redis = "error";
  }

  const allOk = checks.db === "ok" && redisOk;

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
