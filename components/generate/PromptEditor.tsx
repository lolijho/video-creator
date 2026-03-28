"use client";

import { useState } from "react";
import { useEnhancePrompt } from "@/lib/hooks";
import { Sparkles, Loader2 } from "lucide-react";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  label?: string;
}

export function PromptEditor({
  value,
  onChange,
  placeholder = "Describe the video you want to create...",
  maxLength = 2000,
  label = "Prompt",
}: PromptEditorProps) {
  const enhance = useEnhancePrompt();

  const handleEnhance = async () => {
    if (!value.trim() || enhance.isPending) return;
    const result = await enhance.mutateAsync(value);
    onChange(result);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-txt-secondary">{label}</label>
        <span className="text-xs text-txt-muted">
          {value.length}/{maxLength}
        </span>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          rows={4}
          className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm font-mono text-txt-primary placeholder:text-txt-muted resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
        />

        <button
          onClick={handleEnhance}
          disabled={!value.trim() || enhance.isPending}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enhance.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          Enhance
        </button>
      </div>
    </div>
  );
}
