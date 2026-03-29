import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { createApifreeClient } from "@/lib/apifree";
import { imageGenSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

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
        parameters: {
          resolution: data.resolution,
          quality: data.quality,
          style: data.style,
        },
        apiVideoUrl: result.url,
        outputUrl: result.url,
        status: "completed",
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: "completed",
      imageUrl: result.url,
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
