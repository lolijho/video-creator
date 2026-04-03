import { z } from "zod";

export const textToVideoSchema = z.object({
  model: z.string().min(1, "Model is required"),
  prompt: z.string().min(1, "Prompt is required").max(2000),
  negativePrompt: z.string().max(1000).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  duration: z.number().min(2).max(30).default(5),
  quality: z.enum(["standard", "hd", "4k"]).default("standard"),
  motionIntensity: z.enum(["low", "medium", "high"]).default("medium"),
  seed: z.number().int().optional(),
  withAudio: z.boolean().default(false),
});

export const imageToVideoSchema = z.object({
  model: z.string().min(1, "Model is required"),
  prompt: z.string().max(2000).optional(),
  motionPrompt: z.string().max(1000).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  duration: z.number().min(2).max(30).default(5),
  quality: z.enum(["standard", "hd", "4k"]).default("standard"),
  motionIntensity: z.enum(["low", "medium", "high"]).default("medium"),
  seed: z.number().int().optional(),
});

export const videoToVideoSchema = z.object({
  model: z.string().min(1, "Model is required"),
  prompt: z.string().min(1, "Prompt is required").max(2000),
  strength: z.number().min(0.1).max(1.0).default(0.5),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  duration: z.number().min(2).max(30).default(5),
  quality: z.enum(["standard", "hd", "4k"]).default("standard"),
});

export const settingsSchema = z.object({
  apifreeKey: z.string().optional(),
  defaultT2VModel: z.string().optional(),
  defaultI2VModel: z.string().optional(),
  defaultV2VModel: z.string().optional(),
  storageType: z.enum(["local", "s3"]).optional(),
  storagePath: z.string().optional(),
  s3Bucket: z.string().optional(),
  s3Region: z.string().optional(),
  s3Endpoint: z.string().optional(),
  s3AccessKey: z.string().optional(),
  s3SecretKey: z.string().optional(),
  maxUploadMb: z.number().int().min(1).max(500).optional(),
});

export const jobsQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const imageGenSchema = z.object({
  model: z.string().min(1, "Model is required"),
  prompt: z.string().min(1, "Prompt is required").max(2000),
  resolution: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
  quality: z.enum(["standard", "hd"]).default("standard"),
  style: z.enum(["natural", "vivid"]).default("vivid"),
});

export type ImageGenInput = z.infer<typeof imageGenSchema>;
export const splitScenesSchema = z.object({
  prompt: z.string().min(10).max(5000),
  numScenes: z.number().int().min(2).max(10).default(4),
});

export const multiSceneSchema = z.object({
  model: z.string().min(1),
  scenes: z.array(z.object({
    prompt: z.string().min(1).max(2000),
    duration: z.number().min(2).max(10).default(5),
  })).min(2).max(10),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  quality: z.enum(["standard", "hd"]).default("standard"),
});

export type SplitScenesInput = z.infer<typeof splitScenesSchema>;
export type MultiSceneInput = z.infer<typeof multiSceneSchema>;

export type TextToVideoInput = z.infer<typeof textToVideoSchema>;
export type ImageToVideoInput = z.infer<typeof imageToVideoSchema>;
export type VideoToVideoInput = z.infer<typeof videoToVideoSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
