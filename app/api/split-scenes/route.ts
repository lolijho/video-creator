import { NextResponse } from "next/server";
import { getApiKey } from "@/lib/api-key";
import { splitScenesSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = splitScenesSchema.parse(body);

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured. Go to Settings to add your ApiFree.ai key." },
        { status: 400 }
      );
    }

    const baseUrl = (process.env.APIFREE_BASE_URL || "https://api.apifree.ai/v1").replace(/\/$/, "");
    const numScenes = data.numScenes;

    // Try AI-powered splitting first
    try {
      if (process.env.MOCK_MODE === "true") {
        // Mock mode: simple sentence-based split
        return NextResponse.json({ scenes: fallbackSplit(data.prompt, numScenes) });
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a video storyboard assistant. Split the user's description into ${numScenes} distinct video scenes. Each scene should be 5-10 seconds of video. Return a JSON array of objects with 'sceneNumber', 'prompt' (detailed visual description for AI video generation), and 'duration' (in seconds). Only return the JSON array, no other text.`,
            },
            { role: "user", content: data.prompt },
          ],
          max_tokens: 1500,
        }),
      });

      if (!res.ok) {
        console.error("AI split failed, using fallback");
        return NextResponse.json({ scenes: fallbackSplit(data.prompt, numScenes) });
      }

      const aiData = await res.json();
      const content = aiData.choices?.[0]?.message?.content || "";

      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return NextResponse.json({ scenes: fallbackSplit(data.prompt, numScenes) });
      }

      const scenes = JSON.parse(jsonMatch[0]) as Array<{
        sceneNumber: number;
        prompt: string;
        duration: number;
      }>;

      // Validate and normalize
      const normalizedScenes = scenes.map((s, i) => ({
        sceneNumber: i + 1,
        prompt: String(s.prompt || "").slice(0, 2000),
        duration: Math.min(10, Math.max(2, Number(s.duration) || 5)),
      }));

      return NextResponse.json({ scenes: normalizedScenes });
    } catch (aiErr) {
      console.error("AI split error:", aiErr);
      return NextResponse.json({ scenes: fallbackSplit(data.prompt, numScenes) });
    }
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

function fallbackSplit(
  prompt: string,
  numScenes: number
): Array<{ sceneNumber: number; prompt: string; duration: number }> {
  // Split by periods, semicolons, or newlines
  const sentences = prompt
    .split(/[.;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) {
    return [{ sceneNumber: 1, prompt, duration: 5 }];
  }

  // Distribute sentences across scenes
  const scenes: Array<{ sceneNumber: number; prompt: string; duration: number }> = [];
  const perScene = Math.max(1, Math.ceil(sentences.length / numScenes));

  for (let i = 0; i < numScenes && i * perScene < sentences.length; i++) {
    const scenePrompt = sentences.slice(i * perScene, (i + 1) * perScene).join(". ");
    scenes.push({
      sceneNumber: i + 1,
      prompt: scenePrompt,
      duration: 5,
    });
  }

  // If we got fewer scenes than requested, pad with the last scene split
  while (scenes.length < 2) {
    scenes.push({
      sceneNumber: scenes.length + 1,
      prompt: prompt,
      duration: 5,
    });
  }

  return scenes;
}
