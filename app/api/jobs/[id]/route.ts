import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { ApifreeClient } from "@/lib/apifree";
import { saveVideoFromUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.videoJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // If job is still active, poll apifree.ai for status
    if (
      job.apiTaskId &&
      (job.status === "queued" || job.status === "processing")
    ) {
      try {
        const apiKey = await getApiKey();
        if (apiKey) {
          const client = new ApifreeClient(apiKey);
          const statusResult = await client.getTaskStatus(job.apiTaskId);

          if (statusResult.status === "success" || statusResult.status === "completed") {
            // Get the result
            const result = await client.getTaskResult(job.apiTaskId);
            const generationMs = Date.now() - new Date(job.createdAt).getTime();

            let outputUrl = result.video_url;
            let fileSize = 0;
            try {
              const saved = await saveVideoFromUrl(result.video_url, job.id);
              outputUrl = saved.localPath;
              fileSize = saved.fileSize;
            } catch {
              // Use API URL directly
            }

            const updated = await prisma.videoJob.update({
              where: { id: params.id },
              data: {
                status: "completed",
                outputUrl,
                apiVideoUrl: result.video_url,
                generationMs,
                fileSizeBytes: fileSize || null,
              },
            });
            return NextResponse.json(updated);
          }

          if (statusResult.status === "error" || statusResult.status === "failed") {
            const updated = await prisma.videoJob.update({
              where: { id: params.id },
              data: {
                status: "failed",
                errorMessage: "Video generation failed",
              },
            });
            return NextResponse.json(updated);
          }

          // Still processing - update status
          if (job.status !== "processing") {
            await prisma.videoJob.update({
              where: { id: params.id },
              data: { status: "processing" },
            });
            job.status = "processing";
          }
        }
      } catch (err) {
        console.error("Status poll error:", (err as Error).message);
      }
    }

    return NextResponse.json(job);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.videoJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.videoJob.update({
      where: { id: params.id },
      data: { status: "deleted" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
