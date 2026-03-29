import { NextResponse } from "next/server";
import { getCachedModels, refreshModelsCache } from "@/lib/models-cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";
  const type = searchParams.get("type");

  try {
    let models = refresh ? await refreshModelsCache() : await getCachedModels();

    // If no models returned, always fall back to hardcoded
    if (!models || models.length === 0) {
      models = await refreshModelsCache();
    }

    const filtered = type
      ? models.filter((m) => m.types.includes(type))
      : models;

    return NextResponse.json({ models: filtered });
  } catch (err) {
    console.error("Models route error:", err);
    // Return hardcoded fallback even on error
    const { getHardcodedFallback } = await import("@/lib/models-cache");
    const fallback = getHardcodedFallback();
    const filtered = type
      ? fallback.filter((m) => m.types.includes(type))
      : fallback;
    return NextResponse.json({ models: filtered });
  }
}
