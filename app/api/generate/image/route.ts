import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { createApifreeClient } from "@/lib/apifree";
import { imageGenSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Models that use the async /v1/image/submit flow
const ASYNC_IMAGE_MODELS = ["google/nano-banana-pro/edit"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = imageGenSchema.parse(body);

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured. Go to Settings to add your ApiFree.ai key." },
        { status: 400 }
      );
    }

    const client = createApifreeClient(apiKey || "mock");
    const isAsync = ASYNC_IMAGE_MODELS.some((m) => data.model.includes(m) || m.includes(data.model));

    if (isAsync) {
      // Async flow: submit → poll result
      const resMap: Record<string, string> = {
        "1024x1024": "1K",
        "1024x1792": "2K",
        "1792x1024": "2K",
      };

      const submitResult = await client.submitImage({
        model: data.model,
        prompt: data.prompt,
        aspectRatio: data.resolution === "1024x1024" ? "1:1" : data.resolution === "1024x1792" ? "9:16" : "16:9",
        resolution: resMap[data.resolution] || "1K",
      });

      // Poll for result (max 60s)
      let imageUrl: string | undefined;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const result = await client.getImageResult(submitResult.request_id);
        if (result.status === "success" && result.imageUrl) {
          imageUrl = result.imageUrl;
          break;
        }
        if (result.status === "error" || result.status === "failed") {
          throw new Error("Image generation failed");
        }
      }

      if (!imageUrl) throw new Error("Image generation timed out");

      const job = await prisma.videoJob.create({
        data: {
          type: "image",
          model: data.model,
          prompt: data.prompt,
          parameters: { resolution: data.resolution, quality: data.quality, style: data.style },
          apiTaskId: submitResult.request_id,
          apiVideoUrl: imageUrl,
          outputUrl: imageUrl,
          status: "completed",
        },
      });

      return NextResponse.json({ jobId: job.id, status: "completed", imageUrl });
    }

    // Sync flow: OpenAI-compatible /v1/images/generations
    const result = await client.generateImage({
      model: data.model,
      prompt: data.prompt,
      size: data.resolution,
      quality: data.quality,
      style: data.style,
      n: 1,
    });

    const job = await prisma.videoJob.create({
      data: {
        type: "image",
        model: data.model,
        prompt: data.prompt,
        parameters: { resolution: data.resolution, quality: data.quality, style: data.style },
        apiVideoUrl: result.url,
        outputUrl: result.url,
        status: "completed",
      },
    });

    return NextResponse.json({ jobId: job.id, status: "completed", imageUrl: result.url });
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
