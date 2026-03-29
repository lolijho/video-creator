import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { createApifreeClient } from "@/lib/apifree";

export const dynamic = "force-dynamic";

export async function POST(
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

    if (job.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed jobs can be retried" },
        { status: 400 }
      );
    }

    if (job.retryCount >= 3) {
      return NextResponse.json(
        { error: "Maximum retry attempts reached" },
        { status: 400 }
      );
    }

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 400 }
      );
    }

    const client = createApifreeClient(apiKey || "mock");
    const jobParams = job.parameters as Record<string, unknown>;

    let result;
    if (job.type === "text2video") {
      result = await client.submitTextToVideo({
        model: job.model,
        prompt: job.prompt,
        negativePrompt: job.negativePrompt || undefined,
        ...jobParams,
      });
    } else if (job.type === "image2video") {
      result = await client.submitImageToVideo({
        model: job.model,
        imageData: job.inputImageUrl || "",
        prompt: job.prompt || undefined,
        ...jobParams,
      });
    } else {
      result = await client.submitVideoToVideo({
        model: job.model,
        videoUrl: job.inputVideoUrl || "",
        prompt: job.prompt,
        ...jobParams,
      });
    }

    await prisma.videoJob.update({
      where: { id: params.id },
      data: {
        status: "queued",
        apiTaskId: result.request_id,
        errorMessage: null,
        retryCount: job.retryCount + 1,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      taskId: result.request_id,
      status: "queued",
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
