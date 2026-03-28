import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch {
    checks.db = "error";
  }

  try {
    const { redis } = await import("@/lib/redis");
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  // App is healthy as long as it can respond - DB/Redis issues are degraded, not down
  return NextResponse.json({
    status: "ok",
    checks,
    timestamp: new Date().toISOString(),
  });
}
