"use client";

import { GenerateWorkspace } from "@/components/generate/GenerateWorkspace";
import { JobQueue } from "@/components/jobs/JobQueue";
import { useAppStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";

export default function GeneratePage() {
  const { jobQueueOpen } = useAppStore();

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto">
        <GenerateWorkspace />
      </div>
      <AnimatePresence>
        {jobQueueOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l border-border bg-bg-secondary overflow-hidden"
          >
            <JobQueue />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
