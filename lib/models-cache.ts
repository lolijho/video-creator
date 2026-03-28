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

const MODEL_METADATA: Record<string, Partial<ModelMetadata>> = {
  "veo-3": {
    maxDuration: 8,
    supportsAudio: true,
    estimatedSeconds: 120,
    badge: "HD",
    description: "Google's flagship video model with audio generation",
  },
  "veo-3-fast": {
    maxDuration: 8,
    supportsAudio: true,
    estimatedSeconds: 45,
    badge: "FAST",
    description: "Faster variant of Veo 3, great quality/speed balance",
  },
  "veo-2": {
    maxDuration: 10,
    supportsAudio: false,
    estimatedSeconds: 90,
    badge: "I2V",
    description: "Optimized for image-to-video generation",
  },
  "kling-v1.6-standard": {
    maxDuration: 10,
    supportsAudio: false,
    estimatedSeconds: 60,
    description: "Kling 1.6 standard quality",
  },
  "kling-v1.6-pro": {
    maxDuration: 10,
    supportsAudio: false,
    estimatedSeconds: 120,
    badge: "PRO",
    description: "Kling 1.6 professional quality",
  },
  "kling-v2": {
    maxDuration: 10,
    supportsAudio: false,
    estimatedSeconds: 90,
    badge: "NEW",
    description: "Latest Kling model",
  },
  "minimax-video-01": {
    maxDuration: 6,
    supportsAudio: false,
    estimatedSeconds: 60,
    description: "MiniMax Hailuo video generation",
  },
  "luma-dream-machine": {
    maxDuration: 5,
    supportsAudio: false,
    estimatedSeconds: 60,
    description: "Luma AI Dream Machine",
  },
  "wan-2.1": {
    maxDuration: 5,
    supportsAudio: false,
    estimatedSeconds: 45,
    badge: "OPEN",
    description: "WAN 2.1 open source model",
  },
  "cogvideox-5b": {
    maxDuration: 6,
    supportsAudio: false,
    estimatedSeconds: 90,
    description: "CogVideoX by Zhipu AI",
  },
  "ltx-video": {
    maxDuration: 5,
    supportsAudio: false,
    estimatedSeconds: 30,
    badge: "FAST",
    description: "Ultra-fast video generation",
  },
  "hunyuan-video": {
    maxDuration: 5,
    supportsAudio: false,
    estimatedSeconds: 90,
    description: "Tencent Hunyuan video model",
  },
};

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
  const knownVideoIds = Object.keys(MODEL_METADATA);
  if (knownVideoIds.includes(model.id)) return true;

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
        ...MODEL_METADATA[m.id],
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
      const meta = MODEL_METADATA[m.id] || {};

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
  return Object.entries(MODEL_METADATA).map(([id, meta]) => ({
    id,
    name: id
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    types: meta.maxDuration
      ? id.includes("veo-2")
        ? ["image2video", "text2video"]
        : ["text2video", "image2video"]
      : ["text2video"],
    provider: id.startsWith("veo")
      ? "google"
      : id.startsWith("kling")
        ? "klingai"
        : "unknown",
    metadata: { ...DEFAULT_METADATA, ...meta, supportedTypes: ["text2video"] },
  }));
}
