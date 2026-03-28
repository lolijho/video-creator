import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobsQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = jobsQuerySchema.parse({
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    const [jobs, total] = await Promise.all([
      prisma.videoJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.videoJob.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
