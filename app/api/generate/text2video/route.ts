import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { createApifreeClient } from "@/lib/apifree";
import { addPollingJob } from "@/lib/queue";
import { textToVideoSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = textToVideoSchema.parse(body);

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured. Go to Settings to add your ApiFree.ai key." },
        { status: 400 }
      );
    }

    const client = createApifreeClient(apiKey || "mock");

    const result = await client.submitTextToVideo({
      model: data.model,
      prompt: data.prompt,
      negativePrompt: data.negativePrompt,
      aspectRatio: data.aspectRatio,
      duration: data.duration,
      quality: data.quality,
      motionIntensity: data.motionIntensity,
      seed: data.seed,
      withAudio: data.withAudio,
    });

    const job = await prisma.videoJob.create({
      data: {
        type: "text2video",
        model: data.model,
        prompt: data.prompt,
        negativePrompt: data.negativePrompt,
        parameters: {
          aspectRatio: data.aspectRatio,
          duration: data.duration,
          quality: data.quality,
          motionIntensity: data.motionIntensity,
          seed: data.seed,
          withAudio: data.withAudio,
        },
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
