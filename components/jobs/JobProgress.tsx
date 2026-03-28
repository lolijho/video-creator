"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface JobProgressProps {
  status: string;
  createdAt: string;
}

const steps = [
  { label: "Queued", key: "queued" },
  { label: "Processing", key: "processing" },
  { label: "Rendering", key: "rendering" },
  { label: "Done", key: "completed" },
];

function getStepIndex(status: string): number {
  if (status === "queued") return 0;
  if (status === "processing") return 1;
  if (status === "rendering") return 2;
  if (status === "completed") return 3;
  return 0;
}

export function JobProgress({ status, createdAt }: JobProgressProps) {
  const currentStep = getStepIndex(status);
  const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  const progressPercent = status === "queued" ? 15 : status === "processing" ? 55 : 85;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-accent-cyan rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Steps */}
      <div className="flex justify-between">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-1">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                i <= currentStep ? "bg-accent" : "bg-bg-elevated"
              )}
            />
            <span
              className={cn(
                "text-[9px]",
                i <= currentStep ? "text-txt-secondary" : "text-txt-muted"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-txt-muted text-right">
        {elapsed}s elapsed
      </p>
    </div>
  );
}
