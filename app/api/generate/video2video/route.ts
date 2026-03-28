import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { createApifreeClient } from "@/lib/apifree";
import { addPollingJob } from "@/lib/queue";
import { videoToVideoSchema } from "@/lib/validators";
import { saveUploadedFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const videoFile = formData.get("video") as File | null;
    if (!videoFile) {
      return NextResponse.json({ error: "Video file is required" }, { status: 400 });
    }

    const maxMb = 100;
    if (videoFile.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Video must be under ${maxMb}MB` }, { status: 400 });
    }

    const validTypes = ["video/mp4", "video/webm"];
    if (!validTypes.includes(videoFile.type)) {
      return NextResponse.json({ error: "Video must be MP4 or WebM" }, { status: 400 });
    }

    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key !== "video" && typeof value === "string") {
        params[key] = value;
      }
    });

    const data = videoToVideoSchema.parse({
      ...params,
      duration: params.duration ? Number(params.duration) : undefined,
      strength: params.strength ? Number(params.strength) : undefined,
    });

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured. Go to Settings to add your ApiFree.ai key." },
        { status: 400 }
      );
    }

    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    const savedPath = await saveUploadedFile(videoBuffer, videoFile.name, "videos");

    const client = createApifreeClient(apiKey || "mock");

    const result = await client.submitVideoToVideo({
      model: data.model,
      videoUrl: savedPath,
      prompt: data.prompt,
      strength: data.strength,
      aspectRatio: data.aspectRatio,
      duration: data.duration,
      quality: data.quality,
    });

    const job = await prisma.videoJob.create({
      data: {
        type: "video2video",
        model: data.model,
        prompt: data.prompt,
        parameters: {
          aspectRatio: data.aspectRatio,
          duration: data.duration,
          quality: data.quality,
          strength: data.strength,
        },
        inputVideoUrl: savedPath,
        apiTaskId: result.task_id,
        status: "queued",
      },
    });

    await addPollingJob(job.id, result.task_id);

    return NextResponse.json({
      jobId: job.id,
      taskId: result.task_id,
      status: "queued",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: err }, { status: 400 });
    }
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
