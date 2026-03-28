"use client";

import { useAppStore } from "@/lib/store";
import { useActiveJobs, useSettings } from "@/lib/hooks";
import { ListVideo, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { jobQueueOpen, toggleJobQueue } = useAppStore();
  const { data: activeJobs } = useActiveJobs();
  const { data: settings } = useSettings();
  const activeCount = activeJobs?.length || 0;

  return (
    <header className="h-16 border-b border-border bg-bg-secondary/50 backdrop-blur-sm flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-txt-primary">AI Video Generator</h1>
        {!settings?.hasApiKey && (
          <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium">
            API Key Required
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Active jobs indicator */}
        {activeCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
            <Activity className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span className="text-xs text-accent font-medium">
              {activeCount} active
            </span>
          </div>
        )}

        {/* Queue toggle */}
        <button
          onClick={toggleJobQueue}
          className={cn(
            "p-2 rounded-lg transition-colors",
            jobQueueOpen
              ? "bg-accent/15 text-accent"
              : "text-txt-secondary hover:text-txt-primary hover:bg-glass"
          )}
        >
          <ListVideo className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
