"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParameterPanelProps {
  aspectRatio: string;
  onAspectRatioChange: (v: string) => void;
  duration: number;
  onDurationChange: (v: number) => void;
  quality: string;
  onQualityChange: (v: string) => void;
  motionIntensity: string;
  onMotionIntensityChange: (v: string) => void;
  negativePrompt?: string;
  onNegativePromptChange?: (v: string) => void;
  seed?: number;
  onSeedChange?: (v: number | undefined) => void;
  withAudio?: boolean;
  onWithAudioChange?: (v: boolean) => void;
  showAudio?: boolean;
  showNegativePrompt?: boolean;
  maxDuration?: number;
  strength?: number;
  onStrengthChange?: (v: number) => void;
  showStrength?: boolean;
}

export function ParameterPanel({
  aspectRatio,
  onAspectRatioChange,
  duration,
  onDurationChange,
  quality,
  onQualityChange,
  motionIntensity,
  onMotionIntensityChange,
  negativePrompt,
  onNegativePromptChange,
  seed,
  onSeedChange,
  withAudio,
  onWithAudioChange,
  showAudio = false,
  showNegativePrompt = true,
  maxDuration = 10,
  strength,
  onStrengthChange,
  showStrength = false,
}: ParameterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-card hover:bg-bg-elevated transition-colors"
      >
        <span className="text-sm font-medium text-txt-secondary">
          Advanced Parameters
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-txt-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-txt-muted" />
        )}
      </button>

      {expanded && (
        <div className="p-4 bg-bg-card/50 space-y-5 border-t border-border">
          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-txt-muted">Aspect Ratio</label>
            <div className="flex gap-2">
              {["16:9", "9:16", "1:1"].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onAspectRatioChange(ratio)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                    aspectRatio === ratio
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-bg-elevated text-txt-muted border border-transparent hover:text-txt-secondary"
                  )}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-txt-muted">Duration</label>
              <span className="text-xs text-txt-muted">{duration}s</span>
            </div>
            <input
              type="range"
              min={2}
              max={maxDuration}
              step={1}
              value={duration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-full accent-accent h-1"
            />
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-txt-muted">Quality</label>
            <div className="flex gap-2">
              {["standard", "hd", "4k"].map((q) => (
                <button
                  key={q}
                  onClick={() => onQualityChange(q)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors",
                    quality === q
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-bg-elevated text-txt-muted border border-transparent hover:text-txt-secondary"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Motion Intensity */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-txt-muted">Motion Intensity</label>
            <div className="flex gap-2">
              {["low", "medium", "high"].map((m) => (
                <button
                  key={m}
                  onClick={() => onMotionIntensityChange(m)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors",
                    motionIntensity === m
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-bg-elevated text-txt-muted border border-transparent hover:text-txt-secondary"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Strength (for v2v) */}
          {showStrength && onStrengthChange && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-txt-muted">Transform Strength</label>
                <span className="text-xs text-txt-muted">{(strength ?? 0.5).toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.1}
                value={strength ?? 0.5}
                onChange={(e) => onStrengthChange(Number(e.target.value))}
                className="w-full accent-accent h-1"
              />
            </div>
          )}

          {/* Audio toggle */}
          {showAudio && onWithAudioChange && (
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-txt-muted">Generate with Audio</label>
              <button
                onClick={() => onWithAudioChange(!withAudio)}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  withAudio ? "bg-accent" : "bg-bg-elevated border border-border"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                    withAudio ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          )}

          {/* Negative Prompt */}
          {showNegativePrompt && onNegativePromptChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-txt-muted">Negative Prompt</label>
              <textarea
                value={negativePrompt || ""}
                onChange={(e) => onNegativePromptChange(e.target.value)}
                placeholder="What to avoid in the video..."
                rows={2}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-txt-primary placeholder:text-txt-muted resize-none focus:outline-none focus:border-accent/50"
              />
            </div>
          )}

          {/* Seed */}
          {onSeedChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-txt-muted">Seed (optional)</label>
              <input
                type="number"
                value={seed ?? ""}
                onChange={(e) =>
                  onSeedChange(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Random"
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
