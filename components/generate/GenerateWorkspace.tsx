"use client";

import { useAppStore } from "@/lib/store";
import { TextToVideo } from "./TextToVideo";
import { ImageToVideo } from "./ImageToVideo";
import { VideoRemodel } from "./VideoRemodel";
import { ImageGen } from "./ImageGen";
import { cn } from "@/lib/utils";
import { Type, Image, Film, Camera } from "lucide-react";

const tabs = [
  { id: "text2video" as const, label: "Text to Video", icon: Type },
  { id: "image2video" as const, label: "Image to Video", icon: Image },
  { id: "video2video" as const, label: "Video Remodel", icon: Film },
  { id: "image" as const, label: "Image Gen", icon: Camera },
];

export function GenerateWorkspace() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-bg-card rounded-xl mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-txt-secondary hover:text-txt-primary"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "text2video" && <TextToVideo />}
      {activeTab === "image2video" && <ImageToVideo />}
      {activeTab === "video2video" && <VideoRemodel />}
      {activeTab === "image" && <ImageGen />}
    </div>
  );
}
