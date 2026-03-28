import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const model = searchParams.get("model");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {
      status: "completed",
      outputUrl: { not: null },
    };
    if (model) where.model = model;
    if (type) where.type = type;

    const [videos, total] = await Promise.all([
      prisma.videoJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.videoJob.count({ where }),
    ]);

    return NextResponse.json({
      videos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
