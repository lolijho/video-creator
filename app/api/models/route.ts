import { NextResponse } from "next/server";
import { getCachedModels, refreshModelsCache } from "@/lib/models-cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";
  const type = searchParams.get("type");

  try {
    const models = refresh ? await refreshModelsCache() : await getCachedModels();

    const filtered = type
      ? models.filter((m) => m.types.includes(type))
      : models;

    return NextResponse.json({ models: filtered });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
