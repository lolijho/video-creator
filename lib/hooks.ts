import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Auth
export function useAuth() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return { authenticated: false, user: null };
      return res.json() as Promise<{ authenticated: boolean; user: string }>;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// Types
export interface VideoJob {
  id: string;
  type: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  parameters: Record<string, unknown>;
  inputImageUrl?: string;
  inputVideoUrl?: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  apiTaskId?: string;
  apiVideoUrl?: string;
  status: string;
  errorMessage?: string;
  retryCount: number;
  generationMs?: number;
  fileSizeBytes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoModel {
  id: string;
  name: string;
  types: string[];
  provider: string;
  metadata: {
    supportedTypes: string[];
    maxDuration: number;
    aspectRatios: string[];
    supportsAudio: boolean;
    supportsNegativePrompt: boolean;
    estimatedSeconds: number;
    badge?: string;
    description?: string;
  };
}

export interface Settings {
  hasApiKey: boolean;
  defaultT2VModel: string;
  defaultI2VModel: string;
  defaultV2VModel: string;
  storageType: string;
  storagePath: string;
  s3Bucket?: string;
  s3Region?: string;
  s3Endpoint?: string;
  maxUploadMb: number;
}

// Models
export function useModels(type?: string) {
  return useQuery({
    queryKey: ["models", type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      const res = await fetch(`/api/models?${params}`);
      if (!res.ok) throw new Error("Failed to fetch models");
      const data = await res.json();
      return data.models as VideoModel[];
    },
    staleTime: 60 * 60 * 1000,
  });
}

// Jobs
export function useJobs(filters?: { status?: string; type?: string; page?: number }) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.type) params.set("type", filters.type);
      if (filters?.page) params.set("page", String(filters.page));
      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
    refetchInterval: 5000,
  });
}

export function useActiveJobs() {
  return useQuery({
    queryKey: ["jobs", "active"],
    queryFn: async () => {
      const res = await fetch("/api/jobs?status=queued&limit=50");
      if (!res.ok) return [];
      const queued = await res.json();

      const res2 = await fetch("/api/jobs?status=processing&limit=50");
      if (!res2.ok) return queued.jobs as VideoJob[];
      const processing = await res2.json();

      return [...queued.jobs, ...processing.jobs] as VideoJob[];
    },
    refetchInterval: 3000,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json() as Promise<VideoJob>;
    },
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job && (job.status === "completed" || job.status === "failed")) return false;
      return 5000;
    },
  });
}

// Generate
export function useGenerateText2Video() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const res = await fetch("/api/generate/text2video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useGenerateImage2Video() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/generate/image2video", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useGenerateVideo2Video() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/generate/video2video", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useGenerateImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Image generation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

// Gallery
export function useGallery(filters?: { model?: string; type?: string; page?: number }) {
  return useQuery({
    queryKey: ["gallery", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.model) params.set("model", filters.model);
      if (filters?.type) params.set("type", filters.type);
      if (filters?.page) params.set("page", String(filters.page));
      const res = await fetch(`/api/gallery?${params}`);
      if (!res.ok) throw new Error("Failed to fetch gallery");
      return res.json();
    },
  });
}

// Settings
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json() as Promise<Settings>;
    },
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// Enhance Prompt
export function useEnhancePrompt() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Enhancement failed");
      }
      const data = await res.json();
      return data.enhanced as string;
    },
  });
}

// Retry / Delete
export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Retry failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}
