import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { ApifreeClient } from "@/lib/apifree";
import { saveUploadedFile } from "@/lib/storage";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const AVATAR_MODEL = "skywork-ai/skyreels-v3/pro/single-avatar";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const imageFile = formData.get("image") as File | null;
    if (!imageFile) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const audioFile = formData.get("audio") as File | null;
    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const prompt = formData.get("prompt") as string | null;
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Validate image
    const maxImageMb = 10;
    if (imageFile.size > maxImageMb * 1024 * 1024) {
      return NextResponse.json({ error: `Image must be under ${maxImageMb}MB` }, { status: 400 });
    }
    const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validImageTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: "Image must be JPG, PNG, or WebP" }, { status: 400 });
    }

    // Validate audio
    const maxAudioMb = 20;
    if (audioFile.size > maxAudioMb * 1024 * 1024) {
      return NextResponse.json({ error: `Audio must be under ${maxAudioMb}MB` }, { status: 400 });
    }
    const validAudioTypes = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp3"];
    if (!validAudioTypes.includes(audioFile.type)) {
      return NextResponse.json({ error: "Audio must be MP3 or WAV" }, { status: 400 });
    }

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured. Go to Settings to add your ApiFree.ai key." },
        { status: 400 }
      );
    }

    // Process image
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const processedImage = await sharp(imageBuffer)
      .resize(1280, 720, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    const imageBase64 = `data:image/jpeg;base64,${processedImage.toString("base64")}`;

    // Save image upload
    await saveUploadedFile(imageBuffer, imageFile.name, "images");

    // Process audio to base64 data URI
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const audioMime = audioFile.type === "audio/wav" || audioFile.type === "audio/x-wav"
      ? "audio/wav"
      : "audio/mpeg";
    const audioBase64 = `data:${audioMime};base64,${audioBuffer.toString("base64")}`;

    // Save audio upload
    await saveUploadedFile(audioBuffer, audioFile.name, "videos");

    const client = new ApifreeClient(apiKey || "mock");

    const result = await client.submitAvatarVideo({
      model: AVATAR_MODEL,
      firstFrameImage: imageBase64,
      audios: [audioBase64],
      prompt: prompt.trim(),
    });

    const job = await prisma.videoJob.create({
      data: {
        type: "avatar",
        model: AVATAR_MODEL,
        prompt: prompt.trim(),
        parameters: {},
        inputImageUrl: imageBase64.slice(0, 100) + "...",
        apiTaskId: result.request_id,
        status: "queued",
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
