"use client";

import { useJobs, useRetryJob, useDeleteJob, type VideoJob } from "@/lib/hooks";
import { cn, formatRelativeTime, formatDuration } from "@/lib/utils";
import { useState } from "react";
import {
  RefreshCw,
  Trash2,
  Video,
  Image,
  Film,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const statusFilters = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

const typeIcons: Record<string, typeof Video> = {
  text2video: Video,
  image2video: Image,
  video2video: Film,
};

const statusIcons: Record<string, typeof Clock> = {
  queued: Clock,
  processing: Loader2,
  completed: CheckCircle2,
  failed: AlertCircle,
};

export default function QueuePage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const queryStatus = statusFilter === "active" ? undefined : statusFilter || undefined;
  const { data, isLoading } = useJobs({
    status: queryStatus,
    page,
  });

  const retryJob = useRetryJob();
  const deleteJob = useDeleteJob();

  const handleRetry = async (id: string) => {
    try {
      await retryJob.mutateAsync(id);
      toast.success("Job retried");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJob.mutateAsync(id);
      toast.success("Job deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const jobs: VideoJob[] = data?.jobs || [];
  const filtered =
    statusFilter === "active"
      ? jobs.filter((j) => j.status === "queued" || j.status === "processing")
      : jobs;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Job Queue</h1>

        <div className="flex gap-1 p-1 bg-bg-card rounded-lg">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-accent/15 text-accent"
                  : "text-txt-muted hover:text-txt-secondary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-bg-card skeleton-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-12 h-12 text-txt-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-txt-secondary mb-2">No jobs found</h3>
          <p className="text-sm text-txt-muted">Jobs will appear here when you generate videos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => {
            const TypeIcon = typeIcons[job.type] || Video;
            const StatusIcon = statusIcons[job.status] || Clock;

            return (
              <div
                key={job.id}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div className="p-2 rounded-lg bg-bg-elevated">
                  <TypeIcon className="w-4 h-4 text-txt-secondary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-txt-primary truncate">
                    {job.prompt.slice(0, 80)}{job.prompt.length > 80 ? "..." : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-txt-muted">
                    <span>{job.model}</span>
                    <span>{formatRelativeTime(new Date(job.createdAt))}</span>
                    {job.generationMs && (
                      <span>{formatDuration(job.generationMs)}</span>
                    )}
                  </div>
                  {job.errorMessage && (
                    <p className="text-xs text-red-400 mt-1">{job.errorMessage}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className={cn("flex items-center gap-1.5", `status-${job.status}`)}>
                    <StatusIcon
                      className={cn(
                        "w-3.5 h-3.5",
                        job.status === "processing" && "animate-spin"
                      )}
                    />
                    <span className="text-xs font-medium capitalize">{job.status}</span>
                  </div>

                  {job.status === "failed" && (
                    <button
                      onClick={() => handleRetry(job.id)}
                      className="p-1.5 rounded-lg bg-bg-elevated hover:bg-accent/10 text-txt-muted hover:text-accent transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-1.5 rounded-lg bg-bg-elevated hover:bg-red-500/10 text-txt-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
