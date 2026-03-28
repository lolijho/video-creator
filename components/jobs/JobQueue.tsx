"use client";

import { useActiveJobs } from "@/lib/hooks";
import { JobCard } from "./JobCard";
import { ListVideo } from "lucide-react";

export function JobQueue() {
  const { data: jobs, isLoading } = useActiveJobs();

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <ListVideo className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-semibold">Active Jobs</h2>
        {jobs && jobs.length > 0 && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-medium">
            {jobs.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-bg-card skeleton-pulse" />
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <div className="text-center py-12">
            <ListVideo className="w-8 h-8 text-txt-muted mx-auto mb-3" />
            <p className="text-sm text-txt-muted">No active jobs</p>
            <p className="text-xs text-txt-muted mt-1">
              Generated videos will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
