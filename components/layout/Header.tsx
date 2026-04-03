"use client";

import { useAppStore } from "@/lib/store";
import { useActiveJobs, useSettings, useAuth } from "@/lib/hooks";
import { ListVideo, Activity, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const { jobQueueOpen, toggleJobQueue } = useAppStore();
  const { data: activeJobs } = useActiveJobs();
  const { data: settings } = useSettings();
  const { data: auth } = useAuth();
  const activeCount = activeJobs?.length || 0;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-border bg-bg-secondary/50 backdrop-blur-sm flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-txt-primary">AI Video Generator</h1>
        {!settings?.hasApiKey && (
          <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
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

        {/* User / Logout */}
        {auth?.authenticated && auth.user !== "anonymous" && (
          <div className="flex items-center gap-2 ml-1 pl-3 border-l border-border">
            <span className="text-xs text-txt-muted">{auth.user}</span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-txt-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
