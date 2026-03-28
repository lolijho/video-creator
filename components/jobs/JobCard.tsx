"use client";

import { type VideoJob } from "@/lib/hooks";
import { JobProgress } from "./JobProgress";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Video, Image, Film } from "lucide-react";

interface JobCardProps {
  job: VideoJob;
}

const typeIcons = {
  text2video: Video,
  image2video: Image,
  video2video: Film,
};

const statusColors: Record<string, string> = {
  queued: "bg-txt-muted",
  processing: "bg-accent-cyan",
  completed: "bg-accent-green",
  failed: "bg-red-500",
};

export function JobCard({ job }: JobCardProps) {
  const Icon = typeIcons[job.type as keyof typeof typeIcons] || Video;

  return (
    <div className="glass-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-lg bg-bg-elevated">
          <Icon className="w-3.5 h-3.5 text-txt-secondary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-txt-primary truncate">
            {job.prompt.slice(0, 60)}{job.prompt.length > 60 ? "..." : ""}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-txt-muted">{job.model}</span>
            <span className="text-[10px] text-txt-muted">
              {formatRelativeTime(new Date(job.createdAt))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              statusColors[job.status] || "bg-txt-muted",
              job.status === "processing" && "animate-pulse"
            )}
          />
          <span className={cn("text-[10px] font-medium capitalize", `status-${job.status}`)}>
            {job.status}
          </span>
        </div>
      </div>

      {(job.status === "queued" || job.status === "processing") && (
        <JobProgress status={job.status} createdAt={job.createdAt} />
      )}
    </div>
  );
}
