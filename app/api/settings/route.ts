import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { settingsSchema } from "@/lib/validators";
import { createApifreeClient } from "@/lib/apifree";

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "main" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: "main" },
      });
    }

    return NextResponse.json({
      hasApiKey: !!settings.apifreeKeyEnc || !!process.env.APIFREE_API_KEY,
      defaultT2VModel: settings.defaultT2VModel,
      defaultI2VModel: settings.defaultI2VModel,
      defaultV2VModel: settings.defaultV2VModel,
      storageType: settings.storageType,
      storagePath: settings.storagePath,
      s3Bucket: settings.s3Bucket,
      s3Region: settings.s3Region,
      s3Endpoint: settings.s3Endpoint,
      maxUploadMb: settings.maxUploadMb,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = settingsSchema.parse(body);

    const updateData: Record<string, unknown> = {};

    if (data.apifreeKey !== undefined) {
      if (data.apifreeKey === "") {
        updateData.apifreeKeyEnc = null;
      } else {
        // Test the key first
        const client = createApifreeClient(data.apifreeKey);
        const test = await client.testConnection();
        if (!test.ok) {
          return NextResponse.json(
            { error: `API key test failed: ${test.error}` },
            { status: 400 }
          );
        }
        updateData.apifreeKeyEnc = encrypt(data.apifreeKey);
      }
    }

    if (data.defaultT2VModel) updateData.defaultT2VModel = data.defaultT2VModel;
    if (data.defaultI2VModel) updateData.defaultI2VModel = data.defaultI2VModel;
    if (data.defaultV2VModel) updateData.defaultV2VModel = data.defaultV2VModel;
    if (data.storageType) updateData.storageType = data.storageType;
    if (data.storagePath) updateData.storagePath = data.storagePath;
    if (data.s3Bucket !== undefined) updateData.s3Bucket = data.s3Bucket;
    if (data.s3Region !== undefined) updateData.s3Region = data.s3Region;
    if (data.s3Endpoint !== undefined) updateData.s3Endpoint = data.s3Endpoint;
    if (data.s3AccessKey !== undefined) updateData.s3AccessKey = data.s3AccessKey;
    if (data.s3SecretKey !== undefined) {
      updateData.s3SecretKeyEnc = data.s3SecretKey ? encrypt(data.s3SecretKey) : null;
    }
    if (data.maxUploadMb !== undefined) updateData.maxUploadMb = data.maxUploadMb;

    const settings = await prisma.appSettings.upsert({
      where: { id: "main" },
      update: updateData,
      create: { id: "main", ...updateData },
    });

    return NextResponse.json({
      success: true,
      hasApiKey: !!settings.apifreeKeyEnc || !!process.env.APIFREE_API_KEY,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
