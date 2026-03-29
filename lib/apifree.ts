const MOCK_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
];

const MOCK_IMAGES = [
  "https://placehold.co/1024x1024/1a1a2e/e0e0e0?text=Generated+Image",
];

interface SubmitResponse {
  request_id: string;
}

interface StatusResponse {
  status: "queued" | "processing" | "success" | "failed" | string;
}

interface ResultResponse {
  video_url?: string;
  url?: string;
  videos?: Array<{ url: string }>;
  [key: string]: unknown;
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
    this.baseUrl = (process.env.APIFREE_BASE_URL || "https://api.apifree.ai/v1").replace(/\/$/, "");
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
  }): Promise<{ request_id: string }> {
    if (this.isMock) {
      return { request_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
    }

    const body: Record<string, unknown> = {
      model: params.model,
      prompt: params.prompt,
    };
    if (params.negativePrompt) body.negative_prompt = params.negativePrompt;
    if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
    if (params.duration) body.duration = params.duration;
    if (params.quality) body.resolution = params.quality === "hd" ? "720p" : params.quality === "4k" ? "720p" : "480p";
    if (params.seed !== undefined) body.seed = params.seed;
    if (params.withAudio !== undefined) body.with_audio = params.withAudio;

    const res = await this.fetchWithRetry(`${this.baseUrl}/video/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const requestId = data.resp_data?.request_id || data.request_id || data.id;
    if (!requestId) throw new Error("No request_id in response");
    return { request_id: requestId };
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
  }): Promise<{ request_id: string }> {
    if (this.isMock) {
      return { request_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
    }

    const body: Record<string, unknown> = {
      model: params.model,
      image: params.imageData,
      image_data: params.imageData,
    };
    if (params.prompt) body.prompt = params.prompt;
    if (params.motionPrompt) body.motion_prompt = params.motionPrompt;
    if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
    if (params.duration) body.duration = params.duration;
    if (params.quality) body.resolution = params.quality === "hd" ? "720p" : params.quality === "4k" ? "720p" : "480p";
    if (params.seed !== undefined) body.seed = params.seed;

    const res = await this.fetchWithRetry(`${this.baseUrl}/video/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const requestId = data.resp_data?.request_id || data.request_id || data.id;
    if (!requestId) throw new Error("No request_id in response");
    return { request_id: requestId };
  }

  async submitVideoToVideo(params: {
    model: string;
    videoUrl: string;
    prompt: string;
    strength?: number;
    aspectRatio?: string;
    duration?: number;
    quality?: string;
  }): Promise<{ request_id: string }> {
    if (this.isMock) {
      return { request_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
    }

    const body: Record<string, unknown> = {
      model: params.model,
      video: params.videoUrl,
      prompt: params.prompt,
    };
    if (params.strength !== undefined) body.strength = params.strength;
    if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
    if (params.duration) body.duration = params.duration;
    if (params.quality) body.resolution = params.quality === "hd" ? "1080p" : "720p";

    const res = await this.fetchWithRetry(`${this.baseUrl}/video/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const requestId = data.resp_data?.request_id || data.request_id || data.id;
    if (!requestId) throw new Error("No request_id in response");
    return { request_id: requestId };
  }

  async getTaskStatus(requestId: string): Promise<{ status: string }> {
    if (this.isMock) {
      const createdTs = parseInt(requestId.split("_")[1] || "0");
      const elapsed = Date.now() - createdTs;
      if (elapsed < 5000) return { status: "processing" };
      if (elapsed < 15000) return { status: "processing" };
      return { status: "success" };
    }

    const res = await this.fetchWithRetry(
      `${this.baseUrl}/video/${requestId}/status`,
      { method: "GET", headers: this.headers() }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const status = data.resp_data?.status || data.status || "unknown";
    return { status };
  }

  async getTaskResult(requestId: string): Promise<{ video_url: string }> {
    if (this.isMock) {
      return { video_url: MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)] };
    }

    const res = await this.fetchWithRetry(
      `${this.baseUrl}/video/${requestId}/result`,
      { method: "GET", headers: this.headers() }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const respData = data.resp_data || data;
    // video_list is an array of URLs
    const videoList = respData.video_list || respData.videos || [];
    const videoUrl = (Array.isArray(videoList) && videoList.length > 0)
      ? (typeof videoList[0] === "string" ? videoList[0] : videoList[0]?.url)
      : respData.video_url || respData.url || "";

    if (!videoUrl) throw new Error("No video URL in result");
    return { video_url: videoUrl };
  }

  async generateImage(params: {
    model: string;
    prompt: string;
    size?: string;
    quality?: string;
    style?: string;
    n?: number;
  }): Promise<{ url: string }> {
    if (this.isMock) {
      // Simulate a short delay for mock mode
      await new Promise((r) => setTimeout(r, 1500));
      return { url: MOCK_IMAGES[0] };
    }

    const body: Record<string, unknown> = {
      model: params.model,
      prompt: params.prompt,
      n: params.n || 1,
    };
    if (params.size) body.size = params.size;
    if (params.quality) body.quality = params.quality;
    if (params.style) body.style = params.style;

    const res = await this.fetchWithRetry(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const url = data.data?.[0]?.url;
    if (!url) throw new Error("No image URL in response");
    return { url };
  }

  async listModels(): Promise<ApiModel[]> {
    if (this.isMock) {
      return getHardcodedModels();
    }

    try {
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
    } catch {
      return getHardcodedModels();
    }
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
    { id: "google/veo-3/text-to-video", name: "Veo 3", type: "text-to-video", owned_by: "google" },
    { id: "google/veo-3-fast/text-to-video", name: "Veo 3 Fast", type: "text-to-video", owned_by: "google" },
    { id: "google/veo-3.1-fast/image-to-video", name: "Veo 3.1 Fast I2V", type: "image-to-video", owned_by: "google" },
    { id: "google/veo-3.1/image-to-video", name: "Veo 3.1 I2V", type: "image-to-video", owned_by: "google" },
    { id: "kling-v1.6-standard/text-to-video", name: "Kling 1.6 Standard", type: "text-to-video", owned_by: "klingai" },
    { id: "kling-v1.6-pro/text-to-video", name: "Kling 1.6 Pro", type: "text-to-video", owned_by: "klingai" },
    { id: "minimax-video-01/text-to-video", name: "MiniMax Hailuo", type: "text-to-video", owned_by: "minimax" },
    { id: "luma/dream-machine/text-to-video", name: "Luma Dream Machine", type: "text-to-video", owned_by: "luma" },
    { id: "wan-ai/wan-2.1/text-to-video", name: "WAN 2.1", type: "text-to-video", owned_by: "wan-ai" },
    { id: "wan-ai/wan2.2-i2v-a14b/turbo", name: "WAN 2.2 A14B I2V Turbo", type: "image-to-video", owned_by: "wan-ai" },
    { id: "ltx-video/text-to-video", name: "LTX Video", type: "text-to-video", owned_by: "lightricks" },
    { id: "gpt-image-1", name: "GPT Image 1", type: "image", owned_by: "openai" },
    { id: "dall-e-3", name: "DALL-E 3", type: "image", owned_by: "openai" },
    { id: "flux-1.1-pro", name: "Flux 1.1 Pro", type: "image", owned_by: "black-forest-labs" },
  ];
}

export function createApifreeClient(apiKey: string): ApifreeClient {
  return new ApifreeClient(apiKey);
}
