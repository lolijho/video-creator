import { prisma } from "./prisma";
import { createApifreeClient } from "./apifree";
import { decrypt } from "./crypto";

export interface VideoModel {
  id: string;
  name: string;
  types: string[];
  provider: string;
  metadata: ModelMetadata;
}

export interface ModelMetadata {
  supportedTypes: string[];
  maxDuration: number;
  aspectRatios: string[];
  supportsAudio: boolean;
  supportsNegativePrompt: boolean;
  estimatedSeconds: number;
  badge?: string;
  description?: string;
}

const MODEL_METADATA: Record<string, Partial<ModelMetadata>> = {};

// Match metadata by partial ID
function getMetadataForModel(id: string): Partial<ModelMetadata> {
  const lower = id.toLowerCase();
  if (lower.includes("veo-3") && lower.includes("fast") && lower.includes("image"))
    return { maxDuration: 8, supportsAudio: false, estimatedSeconds: 45, badge: "FAST", description: "Veo 3.1 Fast image-to-video" };
  if (lower.includes("veo-3.1") && lower.includes("image"))
    return { maxDuration: 8, supportsAudio: false, estimatedSeconds: 90, badge: "HD", description: "Veo 3.1 image-to-video" };
  if (lower.includes("veo-3") && lower.includes("fast"))
    return { maxDuration: 8, supportsAudio: true, estimatedSeconds: 45, badge: "FAST", description: "Veo 3 Fast text-to-video" };
  if (lower.includes("veo-3"))
    return { maxDuration: 8, supportsAudio: true, estimatedSeconds: 120, badge: "HD", description: "Google Veo 3 with audio" };
  if (lower.includes("kling") && lower.includes("pro"))
    return { maxDuration: 10, estimatedSeconds: 120, badge: "PRO", description: "Kling Pro quality" };
  if (lower.includes("kling"))
    return { maxDuration: 10, estimatedSeconds: 60, description: "Kling video generation" };
  if (lower.includes("minimax"))
    return { maxDuration: 6, estimatedSeconds: 60, description: "MiniMax Hailuo" };
  if (lower.includes("luma") || lower.includes("dream"))
    return { maxDuration: 5, estimatedSeconds: 60, description: "Luma Dream Machine" };
  if (lower.includes("wan2.2") || lower.includes("wan-2.2"))
    return { maxDuration: 5, estimatedSeconds: 30, badge: "FAST", description: "WAN 2.2 A14B I2V Turbo - fastest open source I2V" };
  if (lower.includes("wan"))
    return { maxDuration: 5, estimatedSeconds: 45, badge: "OPEN", description: "WAN 2.1 open source" };
  if (lower.includes("ltx"))
    return { maxDuration: 5, estimatedSeconds: 30, badge: "FAST", description: "LTX ultra-fast" };
  if (lower.includes("hunyuan"))
    return { maxDuration: 5, estimatedSeconds: 90, description: "Tencent Hunyuan" };
  return {};
}

const DEFAULT_METADATA: ModelMetadata = {
  supportedTypes: ["text2video"],
  maxDuration: 5,
  aspectRatios: ["16:9", "9:16", "1:1"],
  supportsAudio: false,
  supportsNegativePrompt: true,
  estimatedSeconds: 60,
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function parseModelTypes(type: unknown): string[] {
  if (Array.isArray(type)) return type;
  if (typeof type === "string") {
    const t = type.toLowerCase();
    const types: string[] = [];
    if (t.includes("text") || t.includes("t2v")) types.push("text2video");
    if (t.includes("image") || t.includes("i2v")) types.push("image2video");
    if (t.includes("video-to-video") || t.includes("v2v")) types.push("video2video");
    if (types.length === 0) types.push("text2video");
    return types;
  }
  return ["text2video"];
}

function isVideoModel(model: { id: string; type?: unknown }): boolean {
  // Check if model ID contains video-related keywords
  if (/video|veo|kling|wan|cog|luma|minimax|hunyuan|ltx|dream/i.test(model.id)) return true;

  if (model.type) {
    const typeStr = typeof model.type === "string" ? model.type : JSON.stringify(model.type);
    return /video|v2v|t2v|i2v/i.test(typeStr);
  }

  return /video|veo|kling|wan|cog|luma|minimax|hunyuan|ltx/i.test(model.id);
}

export async function getCachedModels(): Promise<VideoModel[]> {
  const cached = await prisma.cachedModel.findMany();
  const isFresh =
    cached.length > 0 &&
    cached[0].cachedAt.getTime() > Date.now() - CACHE_TTL_MS;

  if (isFresh) {
    return cached.map((m) => ({
      id: m.id,
      name: m.name,
      types: m.type as string[],
      provider: m.provider || "unknown",
      metadata: {
        ...DEFAULT_METADATA,
        ...getMetadataForModel(m.id),
        supportedTypes: m.type as string[],
        ...(m.metadata as Record<string, unknown> || {}),
      },
    }));
  }

  return refreshModelsCache();
}

export async function refreshModelsCache(): Promise<VideoModel[]> {
  let apiKey = process.env.APIFREE_API_KEY || "";

  if (!apiKey) {
    try {
      const settings = await prisma.appSettings.findUnique({
        where: { id: "main" },
      });
      if (settings?.apifreeKeyEnc) {
        apiKey = decrypt(settings.apifreeKeyEnc);
      }
    } catch {
      // Settings might not exist yet
    }
  }

  if (!apiKey && process.env.MOCK_MODE !== "true") {
    return getHardcodedVideoModels();
  }

  try {
    const client = createApifreeClient(apiKey);
    const allModels = await client.listModels();
    const videoModels = allModels.filter(isVideoModel);

    const models: VideoModel[] = videoModels.map((m) => {
      const types = parseModelTypes(m.type);
      const meta = getMetadataForModel(m.id);

      return {
        id: m.id,
        name: m.name || m.id,
        types,
        provider: m.owned_by || "unknown",
        metadata: {
          ...DEFAULT_METADATA,
          ...meta,
          supportedTypes: types,
        },
      };
    });

    // Update cache
    await prisma.$transaction([
      prisma.cachedModel.deleteMany(),
      ...models.map((m) =>
        prisma.cachedModel.create({
          data: {
            id: m.id,
            name: m.name,
            type: m.types,
            provider: m.provider,
            metadata: JSON.parse(JSON.stringify(m.metadata)),
            cachedAt: new Date(),
          },
        })
      ),
    ]);

    return models;
  } catch (err) {
    console.error("Failed to fetch models from API:", err);
    return getHardcodedVideoModels();
  }
}

function getHardcodedVideoModels(): VideoModel[] {
  const models = [
    { id: "google/veo-3/text-to-video", name: "Veo 3", types: ["text2video"], provider: "google" },
    { id: "google/veo-3-fast/text-to-video", name: "Veo 3 Fast", types: ["text2video"], provider: "google" },
    { id: "google/veo-3.1-fast/image-to-video", name: "Veo 3.1 Fast I2V", types: ["image2video"], provider: "google" },
    { id: "google/veo-3.1/image-to-video", name: "Veo 3.1 I2V", types: ["image2video"], provider: "google" },
    { id: "kling-v1.6-standard/text-to-video", name: "Kling 1.6 Standard", types: ["text2video"], provider: "klingai" },
    { id: "kling-v1.6-pro/text-to-video", name: "Kling 1.6 Pro", types: ["text2video"], provider: "klingai" },
    { id: "minimax-video-01/text-to-video", name: "MiniMax Hailuo", types: ["text2video"], provider: "minimax" },
    { id: "wan-ai/wan-2.1/text-to-video", name: "WAN 2.1", types: ["text2video"], provider: "wan-ai" },
    { id: "wan-ai/wan2.2-i2v-a14b/turbo", name: "WAN 2.2 A14B I2V Turbo", types: ["image2video"], provider: "wan-ai" },
    { id: "ltx-video/text-to-video", name: "LTX Video", types: ["text2video"], provider: "lightricks" },
  ];

  return models.map((m) => ({
    ...m,
    metadata: {
      ...DEFAULT_METADATA,
      ...getMetadataForModel(m.id),
      supportedTypes: m.types,
    },
  }));
}
