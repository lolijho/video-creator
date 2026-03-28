import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVideoPath } from "@/lib/storage";
import { createReadStream, statSync } from "fs";
import { Readable } from "stream";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.videoJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const videoPath = getVideoPath(params.id);

    try {
      const stats = statSync(videoPath);
      const stream = createReadStream(videoPath);
      const webStream = Readable.toWeb(stream) as ReadableStream;

      return new Response(webStream, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": stats.size.toString(),
          "Content-Disposition": `attachment; filename="${params.id}.mp4"`,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      // File not on disk, try API URL
      if (job.apiVideoUrl) {
        return NextResponse.redirect(job.apiVideoUrl);
      }
      return NextResponse.json({ error: "Video file not found" }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
