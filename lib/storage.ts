import { mkdir, writeFile, unlink, stat } from "fs/promises";
import { join } from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const STORAGE_PATH = process.env.STORAGE_PATH || "/app/storage";

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

export async function saveVideoFromUrl(
  videoUrl: string,
  jobId: string
): Promise<{ localPath: string; fileSize: number }> {
  const videosDir = join(STORAGE_PATH, "videos");
  await ensureDir(videosDir);

  const filename = `${jobId}.mp4`;
  const localPath = join(videosDir, filename);

  const response = await fetch(videoUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const nodeStream = Readable.fromWeb(response.body as import("stream/web").ReadableStream);
  const writeStream = createWriteStream(localPath);
  await pipeline(nodeStream, writeStream);

  const stats = await stat(localPath);
  return { localPath: `/api/video/${jobId}/download`, fileSize: stats.size };
}

export async function saveThumbnail(
  thumbnailUrl: string,
  jobId: string
): Promise<string> {
  const thumbsDir = join(STORAGE_PATH, "thumbnails");
  await ensureDir(thumbsDir);

  const filename = `${jobId}.jpg`;
  const localPath = join(thumbsDir, filename);

  const response = await fetch(thumbnailUrl);
  if (!response.ok || !response.body) {
    return "";
  }

  const nodeStream = Readable.fromWeb(response.body as import("stream/web").ReadableStream);
  const writeStream = createWriteStream(localPath);
  await pipeline(nodeStream, writeStream);

  return `/api/video/${jobId}/thumbnail`;
}

export async function saveUploadedFile(
  buffer: Buffer,
  filename: string,
  type: "images" | "videos"
): Promise<string> {
  const dir = join(STORAGE_PATH, "uploads", type);
  await ensureDir(dir);

  const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = join(dir, safeName);
  await writeFile(filePath, buffer);

  return filePath;
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // File might not exist
  }
}

export function getVideoPath(jobId: string): string {
  return join(STORAGE_PATH, "videos", `${jobId}.mp4`);
}

export function getThumbnailPath(jobId: string): string {
  return join(STORAGE_PATH, "thumbnails", `${jobId}.jpg`);
}
