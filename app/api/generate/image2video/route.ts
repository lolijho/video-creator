import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/api-key";
import { createApifreeClient } from "@/lib/apifree";
import { addPollingJob } from "@/lib/queue";
import { imageToVideoSchema } from "@/lib/validators";
import { saveUploadedFile } from "@/lib/storage";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const imageFile = formData.get("image") as File | null;
    if (!imageFile) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const maxMb = 10;
    if (imageFile.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Image must be under ${maxMb}MB` }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: "Image must be JPG, PNG, or WebP" }, { status: 400 });
    }

    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key !== "image" && typeof value === "string") {
        params[key] = value;
      }
    });

    const data = imageToVideoSchema.parse({
      ...params,
      duration: params.duration ? Number(params.duration) : undefined,
      seed: params.seed ? Number(params.seed) : undefined,
    });

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured. Go to Settings to add your ApiFree.ai key." },
        { status: 400 }
      );
    }

    // Process image with Sharp
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const processedImage = await sharp(imageBuffer)
      .resize(1280, 720, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    const imageBase64 = `data:image/jpeg;base64,${processedImage.toString("base64")}`;

    // Save uploaded file
    const savedPath = await saveUploadedFile(imageBuffer, imageFile.name, "images");

    const client = createApifreeClient(apiKey || "mock");

    const result = await client.submitImageToVideo({
      model: data.model,
      imageData: imageBase64,
      prompt: data.prompt,
      motionPrompt: data.motionPrompt,
      aspectRatio: data.aspectRatio,
      duration: data.duration,
      quality: data.quality,
      motionIntensity: data.motionIntensity,
      seed: data.seed,
    });

    const job = await prisma.videoJob.create({
      data: {
        type: "image2video",
        model: data.model,
        prompt: data.prompt || "",
        parameters: {
          aspectRatio: data.aspectRatio,
          duration: data.duration,
          quality: data.quality,
          motionIntensity: data.motionIntensity,
          motionPrompt: data.motionPrompt,
          seed: data.seed,
        },
        inputImageUrl: savedPath,
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
