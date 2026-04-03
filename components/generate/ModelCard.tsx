"use client";

import { motion } from "framer-motion";
import { type VideoModel } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Clock, Zap, Crown, Star } from "lucide-react";

interface ModelCardProps {
  model: VideoModel;
  isSelected: boolean;
  onSelect: () => void;
}

const providerColors: Record<string, string> = {
  google: "text-blue-400",
  klingai: "text-green-400",
  minimax: "text-orange-400",
  luma: "text-purple-400",
  "wan-ai": "text-cyan-400",
  zhipu: "text-red-400",
  lightricks: "text-yellow-400",
  tencent: "text-emerald-400",
};

const badgeStyles: Record<string, { bg: string; text: string; icon: typeof Zap }> = {
  FAST: { bg: "bg-accent-cyan/15", text: "text-accent-cyan", icon: Zap },
  HD: { bg: "bg-accent/15", text: "text-accent", icon: Crown },
  PRO: { bg: "bg-amber-500/15", text: "text-amber-400", icon: Star },
  NEW: { bg: "bg-accent-green/15", text: "text-accent-green", icon: Star },
  OPEN: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: Star },
  I2V: { bg: "bg-purple-500/15", text: "text-purple-400", icon: Star },
  EDIT: { bg: "bg-accent/15", text: "text-accent", icon: Star },
  TTS: { bg: "bg-accent-cyan/15", text: "text-accent-cyan", icon: Star },
};

export function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  const badge = model.metadata.badge;
  const badgeStyle = badge ? badgeStyles[badge] : null;
  const providerColor = providerColors[model.provider] || "text-txt-muted";
  const estTime = model.metadata.estimatedSeconds;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative p-4 rounded-xl text-left transition-all duration-200 group",
        isSelected
          ? "bg-accent/10 border-2 border-accent/50 shadow-lg shadow-accent/5"
          : "bg-bg-card border border-border hover:border-border-hover"
      )}
    >
      {/* Badge */}
      {badgeStyle && (
        <div
          className={cn(
            "absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1",
            badgeStyle.bg,
            badgeStyle.text
          )}
        >
          <badgeStyle.icon className="w-2.5 h-2.5" />
          {badge}
        </div>
      )}

      {/* Model name */}
      <h3 className="font-semibold text-sm text-txt-primary mb-1 pr-14">
        {model.name}
      </h3>

      {/* Provider */}
      <p className={cn("text-xs capitalize mb-3", providerColor)}>
        {model.provider}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-txt-muted">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          ~{estTime}s
        </div>
        {model.metadata.supportsAudio && (
          <div className="px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green text-[10px] font-medium">
            Audio
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          layoutId="model-selected"
          className="absolute inset-0 rounded-xl border-2 border-accent pointer-events-none"
        />
      )}
    </motion.button>
  );
}
