import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { createApifreeClient } from "@/lib/apifree";
import { ttsSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = ttsSchema.parse(body);

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured. Go to Settings to add your ApiFree.ai key." },
        { status: 400 }
      );
    }

    const client = createApifreeClient(apiKey || "mock");

    const submitResult = await client.submitAudio({
      model: "hexgrad/kokoro-tts/italian",
      prompt: data.prompt,
      voice: data.voice,
      speed: data.speed,
    });

    // Poll for result (max 30s, every 2s)
    const maxAttempts = 15;
    let audioUrl: string | undefined;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const result = await client.getAudioResult(submitResult.request_id);

      if (result.status === "success" && result.audioUrl) {
        audioUrl = result.audioUrl;
        break;
      }

      if (result.status === "failed") {
        throw new Error("TTS generation failed on the server");
      }
    }

    if (!audioUrl) {
      throw new Error("TTS generation timed out after 30 seconds");
    }

    const job = await prisma.videoJob.create({
      data: {
        type: "tts",
        model: "hexgrad/kokoro-tts/italian",
        prompt: data.prompt,
        parameters: {
          voice: data.voice,
          speed: data.speed,
        },
        apiTaskId: submitResult.request_id,
        apiVideoUrl: audioUrl,
        outputUrl: audioUrl,
        status: "completed",
      },
    });

    return NextResponse.json({
      audioUrl,
      jobId: job.id,
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
