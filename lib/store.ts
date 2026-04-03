import { create } from "zustand";

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  activeTab: "text2video" | "image2video" | "video2video" | "image" | "multiscene";
  setActiveTab: (tab: "text2video" | "image2video" | "video2video" | "image" | "multiscene") => void;

  selectedModel: string;
  setSelectedModel: (model: string) => void;

  jobQueueOpen: boolean;
  setJobQueueOpen: (open: boolean) => void;
  toggleJobQueue: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  activeTab: "text2video",
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedModel: "veo-3-fast",
  setSelectedModel: (model) => set({ selectedModel: model }),

  jobQueueOpen: true,
  setJobQueueOpen: (open) => set({ jobQueueOpen: open }),
  toggleJobQueue: () => set((s) => ({ jobQueueOpen: !s.jobQueueOpen })),
}));
