"use client";

import { useState, useRef } from "react";
import { type VideoJob, useDeleteJob, useRetryJob } from "@/lib/hooks";
import { formatRelativeTime, formatDuration, formatFileSize } from "@/lib/utils";
import { Download, Trash2, RefreshCw, Play, Clock, HardDrive } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface VideoCardProps {
  video: VideoJob;
}

export function VideoCard({ video }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const deleteJob = useDeleteJob();
  const retryJob = useRetryJob();

  const videoSrc = video.outputUrl || video.apiVideoUrl;
  const isImage = video.type === "image";

  const handleMouseEnter = () => {
    setIsHovered(true);
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleDownload = () => {
    if (video.outputUrl) {
      const a = document.createElement("a");
      a.href = video.outputUrl;
      a.download = isImage ? `${video.id}.png` : `${video.id}.mp4`;
      a.click();
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob.mutateAsync(video.id);
      toast.success("Video deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card overflow-hidden group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video / Thumbnail / Image */}
      <div className={`${isImage ? "aspect-square" : "aspect-video"} bg-bg-elevated relative overflow-hidden`}>
        {isImage && videoSrc ? (
          <img
            src={videoSrc}
            alt={video.prompt?.slice(0, 80) || "Generated image"}
            className="w-full h-full object-cover"
          />
        ) : videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-txt-muted" />
          </div>
        )}

        {/* Hover overlay */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3"
          >
            <div className="flex gap-1.5">
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/50 text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-txt-primary font-medium truncate mb-1">
          {video.prompt.slice(0, 50)}{video.prompt.length > 50 ? "..." : ""}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-txt-muted">
          <span className="capitalize">{video.model}</span>
          {video.generationMs && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(video.generationMs)}
            </span>
          )}
          {video.fileSizeBytes && (
            <span className="flex items-center gap-0.5">
              <HardDrive className="w-2.5 h-2.5" />
              {formatFileSize(video.fileSizeBytes)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-txt-muted mt-1">
          {formatRelativeTime(new Date(video.createdAt))}
        </p>
      </div>
    </motion.div>
  );
}
