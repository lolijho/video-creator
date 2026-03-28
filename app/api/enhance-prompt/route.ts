import { NextResponse } from "next/server";
import { getApiKey } from "@/lib/api-key";
import { createApifreeClient } from "@/lib/apifree";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = schema.parse(body);

    const apiKey = await getApiKey();
    if (!apiKey && process.env.MOCK_MODE !== "true") {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 400 }
      );
    }

    const client = createApifreeClient(apiKey || "mock");
    const enhanced = await client.enhancePrompt(prompt);

    return NextResponse.json({ enhanced });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
