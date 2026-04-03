import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { createApifreeClient } from "@/lib/apifree";
import { multiSceneSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = multiSceneSchema.parse(body);

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured. Go to Settings to add your ApiFree.ai key." },
        { status: 400 }
      );
    }

    const client = createApifreeClient(apiKey || "mock");

    // Submit each scene as a separate job
    const sceneResults: Array<{
      sceneNumber: number;
      requestId: string;
    }> = [];

    for (let i = 0; i < data.scenes.length; i++) {
      const scene = data.scenes[i];
      const result = await client.submitTextToVideo({
        model: data.model,
        prompt: scene.prompt,
        aspectRatio: data.aspectRatio,
        duration: scene.duration,
        quality: data.quality,
      });
      sceneResults.push({
        sceneNumber: i + 1,
        requestId: result.request_id,
      });
    }

    // Create child job entries for each scene
    const childJobIds: string[] = [];
    const sceneJobs: Array<{ jobId: string; sceneNumber: number; taskId: string }> = [];

    for (const sr of sceneResults) {
      const childJob = await prisma.videoJob.create({
        data: {
          type: "multiscene_part",
          model: data.model,
          prompt: data.scenes[sr.sceneNumber - 1].prompt,
          parameters: {
            aspectRatio: data.aspectRatio,
            duration: data.scenes[sr.sceneNumber - 1].duration,
            quality: data.quality,
            sceneNumber: sr.sceneNumber,
          },
          apiTaskId: sr.requestId,
          status: "queued",
        },
      });
      childJobIds.push(childJob.id);
      sceneJobs.push({
        jobId: childJob.id,
        sceneNumber: sr.sceneNumber,
        taskId: sr.requestId,
      });
    }

    // Create parent job that references all children
    const parentJob = await prisma.videoJob.create({
      data: {
        type: "multiscene",
        model: data.model,
        prompt: data.scenes.map((s) => s.prompt).join(" | "),
        parameters: {
          aspectRatio: data.aspectRatio,
          quality: data.quality,
          childJobIds,
          totalScenes: data.scenes.length,
          totalDuration: data.scenes.reduce((sum, s) => sum + s.duration, 0),
        },
        status: "processing",
      },
    });

    return NextResponse.json({
      parentJobId: parentJob.id,
      sceneJobs,
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
