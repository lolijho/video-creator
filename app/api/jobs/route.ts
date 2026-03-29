import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobsQuerySchema } from "@/lib/validators";
import { getApiKey } from "@/lib/api-key";
import { ApifreeClient } from "@/lib/apifree";
import { saveVideoFromUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function pollActiveJobs() {
  try {
    const activeJobs = await prisma.videoJob.findMany({
      where: {
        status: { in: ["queued", "processing"] },
        apiTaskId: { not: null },
      },
      take: 10,
    });

    if (activeJobs.length === 0) return;

    const apiKey = await getApiKey();
    if (!apiKey) return;

    const client = new ApifreeClient(apiKey);

    for (const job of activeJobs) {
      try {
        const statusResult = await client.getTaskStatus(job.apiTaskId!);

        if (statusResult.status === "success" || statusResult.status === "completed") {
          const result = await client.getTaskResult(job.apiTaskId!);
          const generationMs = Date.now() - new Date(job.createdAt).getTime();

          let outputUrl = result.video_url;
          let fileSize = 0;
          try {
            const saved = await saveVideoFromUrl(result.video_url, job.id);
            outputUrl = saved.localPath;
            fileSize = saved.fileSize;
          } catch {
            // Use API URL
          }

          await prisma.videoJob.update({
            where: { id: job.id },
            data: {
              status: "completed",
              outputUrl,
              apiVideoUrl: result.video_url,
              generationMs,
              fileSizeBytes: fileSize || null,
            },
          });
        } else if (statusResult.status === "error" || statusResult.status === "failed") {
          await prisma.videoJob.update({
            where: { id: job.id },
            data: { status: "failed", errorMessage: "Generation failed" },
          });
        } else if (job.status === "queued") {
          await prisma.videoJob.update({
            where: { id: job.id },
            data: { status: "processing" },
          });
        }
      } catch {
        // Skip this job on error
      }
    }
  } catch {
    // Ignore polling errors
  }
}

export async function GET(request: Request) {
  try {
    // Fire-and-forget: poll active jobs in background, don't block response
    pollActiveJobs().catch(() => {});

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
