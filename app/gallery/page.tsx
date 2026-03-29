"use client";

import { VideoGrid } from "@/components/gallery/VideoGrid";
import { useState } from "react";
import { cn } from "@/lib/utils";

const typeFilters = [
  { label: "All", value: "" },
  { label: "Text to Video", value: "text2video" },
  { label: "Image to Video", value: "image2video" },
  { label: "Video Remodel", value: "video2video" },
  { label: "Image Gen", value: "image" },
];

export default function GalleryPage() {
  const [typeFilter, setTypeFilter] = useState("");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Gallery</h1>

        <div className="flex gap-1 p-1 bg-bg-card rounded-lg">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                typeFilter === f.value
                  ? "bg-accent/15 text-accent"
                  : "text-txt-muted hover:text-txt-secondary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <VideoGrid typeFilter={typeFilter || undefined} />
    </div>
  );
}
