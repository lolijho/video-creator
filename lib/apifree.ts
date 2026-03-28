const MOCK_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
];

interface SubmitResponse {
  task_id: string;
  status: string;
}

interface TaskStatusResponse {
  status: "queued" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
}

interface ApiModel {
  id: string;
  name?: string;
  type?: string | string[];
  owned_by?: string;
  [key: string]: unknown;
}

interface TestConnectionResult {
  ok: boolean;
  modelsCount?: number;
  error?: string;
}

export class ApifreeClient {
  private baseUrl: string;
  private apiKey: string;
  private isMock: boolean;

  constructor(apiKey: string) {
    this.baseUrl = process.env.APIFREE_BASE_URL || "https://api.apifree.ai/v1";
    this.apiKey = apiKey;
    this.isMock = process.env.MOCK_MODE === "true";
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.status === 429 || response.status === 503) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
        }

        return response;
      } catch (err) {
        lastError = err as Error;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async submitTextToVideo(params: {
    model: string;
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: string;
    duration?: number;
    quality?: string;
    motionIntensity?: string;
    seed?: number;
    withAudio?: boolean;
  }): Promise<SubmitResponse> {
    if (this.isMock) {
      return {
        task_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: "queued",
      };
    }

    const body: Record<string, unknown> = {
      model: params.model,
      prompt: params.prompt,
    };
    if (params.negativePrompt) body.negative_prompt = params.negativePrompt;
    if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
    if (params.duration) body.duration = params.duration;
    if (params.quality) body.quality = params.quality;
    if (params.motionIntensity) body.motion_intensity = params.motionIntensity;
    if (params.seed !== undefined) body.seed = params.seed;
    if (params.withAudio !== undefined) body.with_audio = params.withAudio;

    const res = await this.fetchWithRetry(`${this.baseUrl}/video/generate`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    return res.json();
  }

  async submitImageToVideo(params: {
    model: string;
    imageData: string;
    prompt?: string;
    motionPrompt?: string;
    aspectRatio?: string;
    duration?: number;
    quality?: string;
    motionIntensity?: string;
    seed?: number;
  }): Promise<SubmitResponse> {
    if (this.isMock) {
      return {
        task_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: "queued",
      };
    }

    const body: Record<string, unknown> = {
      model: params.model,
      image: params.imageData,
    };
    if (params.prompt) body.prompt = params.prompt;
    if (params.motionPrompt) body.motion_prompt = params.motionPrompt;
    if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
    if (params.duration) body.duration = params.duration;
    if (params.quality) body.quality = params.quality;
    if (params.motionIntensity) body.motion_intensity = params.motionIntensity;
    if (params.seed !== undefined) body.seed = params.seed;

    const res = await this.fetchWithRetry(`${this.baseUrl}/video/generate`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    return res.json();
  }

  async submitVideoToVideo(params: {
    model: string;
    videoUrl: string;
    prompt: string;
    strength?: number;
    aspectRatio?: string;
    duration?: number;
    quality?: string;
  }): Promise<SubmitResponse> {
    if (this.isMock) {
      return {
        task_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: "queued",
      };
    }

    const body: Record<string, unknown> = {
      model: params.model,
      video: params.videoUrl,
      prompt: params.prompt,
    };
    if (params.strength !== undefined) body.strength = params.strength;
    if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
    if (params.duration) body.duration = params.duration;
    if (params.quality) body.quality = params.quality;

    const res = await this.fetchWithRetry(`${this.baseUrl}/video/generate`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    return res.json();
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    if (this.isMock) {
      const mockId = taskId;
      const createdTs = parseInt(mockId.split("_")[1] || "0");
      const elapsed = Date.now() - createdTs;

      if (elapsed < 5000) return { status: "queued" };
      if (elapsed < 15000) return { status: "processing" };

      return {
        status: "completed",
        video_url: MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)],
        thumbnail_url: undefined,
        duration: 10,
      };
    }

    const res = await this.fetchWithRetry(
      `${this.baseUrl}/video/status/${taskId}`,
      { method: "GET", headers: this.headers() }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    return res.json();
  }

  async listModels(): Promise<ApiModel[]> {
    if (this.isMock) {
      return getHardcodedModels();
    }

    const res = await this.fetchWithRetry(`${this.baseUrl}/models`, {
      method: "GET",
      headers: this.headers(),
    });

    if (!res.ok) {
      console.error("Failed to fetch models, using hardcoded fallback");
      return getHardcodedModels();
    }

    const data = await res.json();
    return data.data || data.models || data || [];
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const models = await this.listModels();
      return { ok: true, modelsCount: models.length };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async enhancePrompt(prompt: string): Promise<string> {
    if (this.isMock) {
      return `Cinematic ${prompt}, 4K ultra-detailed, dramatic lighting, smooth camera movement, professional color grading, depth of field, film grain`;
    }

    try {
      const res = await this.fetchWithRetry(
        `${this.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a video prompt engineer. Enhance the given prompt to produce cinematic, high-quality AI video. Add details about lighting, camera movement, style, mood, and quality. Keep it under 500 characters. Return ONLY the enhanced prompt.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 300,
          }),
        }
      );

      if (!res.ok) return prompt;
      const data = await res.json();
      return data.choices?.[0]?.message?.content || prompt;
    } catch {
      return prompt;
    }
  }
}

function getHardcodedModels(): ApiModel[] {
  return [
    { id: "veo-3", name: "Veo 3", type: "text-to-video", owned_by: "google" },
    { id: "veo-3-fast", name: "Veo 3 Fast", type: "text-to-video", owned_by: "google" },
    { id: "veo-2", name: "Veo 2", type: "image-to-video", owned_by: "google" },
    { id: "kling-v1.6-standard", name: "Kling 1.6 Standard", type: "text-to-video", owned_by: "klingai" },
    { id: "kling-v1.6-pro", name: "Kling 1.6 Pro", type: "text-to-video", owned_by: "klingai" },
    { id: "kling-v2", name: "Kling 2", type: "text-to-video", owned_by: "klingai" },
    { id: "minimax-video-01", name: "MiniMax Hailuo", type: "text-to-video", owned_by: "minimax" },
    { id: "luma-dream-machine", name: "Luma Dream Machine", type: "text-to-video", owned_by: "luma" },
    { id: "wan-2.1", name: "WAN 2.1", type: "text-to-video", owned_by: "wan-ai" },
    { id: "cogvideox-5b", name: "CogVideoX", type: "text-to-video", owned_by: "zhipu" },
    { id: "ltx-video", name: "LTX Video", type: "text-to-video", owned_by: "lightricks" },
    { id: "hunyuan-video", name: "Hunyuan Video", type: "text-to-video", owned_by: "tencent" },
  ];
}

export function createApifreeClient(apiKey: string): ApifreeClient {
  return new ApifreeClient(apiKey);
}
