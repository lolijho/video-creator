"use client";

import { useGallery, type VideoJob } from "@/lib/hooks";
import { VideoCard } from "./VideoCard";
import { FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface VideoGridProps {
  modelFilter?: string;
  typeFilter?: string;
}

export function VideoGrid({ modelFilter, typeFilter }: VideoGridProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGallery({
    model: modelFilter,
    type: typeFilter,
    page,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video rounded-xl bg-bg-card skeleton-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data?.videos || data.videos.length === 0) {
    return (
      <div className="text-center py-20">
        <FolderOpen className="w-12 h-12 text-txt-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-txt-secondary mb-2">
          No videos yet
        </h3>
        <p className="text-sm text-txt-muted">
          Generate your first video to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.videos.map((video: VideoJob) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-bg-card text-txt-secondary hover:text-txt-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-txt-muted px-4">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="p-2 rounded-lg bg-bg-card text-txt-secondary hover:text-txt-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
