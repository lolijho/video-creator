"use client";

import { useState } from "react";
import { PromptEditor } from "./PromptEditor";
import { ModelSelector } from "./ModelSelector";
import { useSplitScenes, useGenerateMultiScene, useJob } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import {
  Loader2,
  Clapperboard,
  Sparkles,
  Plus,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  Clock,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Scene {
  sceneNumber: number;
  prompt: string;
  duration: number;
}

interface SceneJob {
  jobId: string;
  sceneNumber: number;
  taskId: string;
}

function SceneProgress({ jobId, sceneNumber }: { jobId: string; sceneNumber: number }) {
  const { data: job } = useJob(jobId);
  const status = job?.status || "queued";

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-bg-elevated">
      <span className="text-xs font-medium text-txt-muted w-16">Scene {sceneNumber}</span>
      <div className="flex-1 h-1.5 bg-bg-card rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === "completed" ? "bg-green-500" :
            status === "failed" ? "bg-red-500" :
            "bg-accent"
          )}
          initial={{ width: "5%" }}
          animate={{
            width: status === "completed" ? "100%" :
                   status === "failed" ? "100%" :
                   status === "processing" ? "60%" : "15%"
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex items-center gap-1.5 w-28 justify-end">
        {status === "completed" ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        ) : status === "failed" ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        ) : status === "processing" ? (
          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-txt-muted" />
        )}
        <span className={cn(
          "text-xs font-medium capitalize",
          status === "completed" ? "text-green-500" :
          status === "failed" ? "text-red-500" :
          status === "processing" ? "text-amber-400" :
          "text-txt-muted"
        )}>
          {status}
        </span>
        {status === "completed" && job?.outputUrl && (
          <a
            href={job.outputUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-accent hover:text-accent-glow transition-colors"
            title="View video"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function useSceneJobStatuses(sceneJobs: SceneJob[]) {
  // Query each job individually to track aggregate status
  const jobs = sceneJobs.map((sj) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useJob(sj.jobId);
    return { sceneNumber: sj.sceneNumber, status: data?.status || "queued", outputUrl: data?.outputUrl };
  });
  const allCompleted = jobs.length > 0 && jobs.every((j) => j.status === "completed");
  const anyFailed = jobs.some((j) => j.status === "failed");
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  return { jobs, allCompleted, anyFailed, completedCount };
}

export function MultiScene() {
  const { selectedModel, setSelectedModel } = useAppStore();
  const [storyPrompt, setStoryPrompt] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [numScenes, setNumScenes] = useState(4);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [quality, setQuality] = useState("standard");
  const [sceneJobs, setSceneJobs] = useState<SceneJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const splitScenes = useSplitScenes();
  const generateMulti = useGenerateMultiScene();

  const handleSplit = async () => {
    if (!storyPrompt.trim()) {
      toast.error("Write a story prompt first");
      return;
    }
    try {
      const result = await splitScenes.mutateAsync({
        prompt: storyPrompt,
        numScenes,
      });
      setScenes(result.scenes);
      toast.success(`Split into ${result.scenes.length} scenes`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const updateScene = (index: number, prompt: string) => {
    setScenes((prev) =>
      prev.map((s, i) => (i === index ? { ...s, prompt } : s))
    );
  };

  const updateDuration = (index: number, duration: number) => {
    setScenes((prev) =>
      prev.map((s, i) => (i === index ? { ...s, duration } : s))
    );
  };

  const removeScene = (index: number) => {
    setScenes((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, sceneNumber: i + 1 }))
    );
  };

  const addScene = () => {
    setScenes((prev) => [
      ...prev,
      { sceneNumber: prev.length + 1, prompt: "", duration: 5 },
    ]);
  };

  const handleGenerate = async () => {
    if (scenes.length < 2) {
      toast.error("Need at least 2 scenes");
      return;
    }
    if (scenes.some((s) => !s.prompt.trim())) {
      toast.error("All scenes need a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMulti.mutateAsync({
        model: selectedModel,
        scenes: scenes.map((s) => ({ prompt: s.prompt, duration: s.duration })),
        aspectRatio,
        quality,
      });
      setSceneJobs(result.sceneJobs || []);
      toast.success(`${scenes.length} scenes submitted for generation!`);
    } catch (err) {
      toast.error((err as Error).message);
      setIsGenerating(false);
    }
  };

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const allCompleted = sceneJobs.length > 0 && sceneJobs.every((sj) => {
    // We'll check via the SceneProgress component, but for the banner we need a simple check
    return false; // Will be tracked by individual SceneProgress
  });

  return (
    <div className="space-y-6">
      {/* Story Prompt */}
      <PromptEditor
        value={storyPrompt}
        onChange={setStoryPrompt}
        label="Story Prompt"
        placeholder="Describe your video story... e.g. 'A sunrise over snow-capped mountains. The camera slowly pans down to reveal a peaceful village. People are walking through a morning market. Close-up of a food stall with steam rising. Wide shot of the sunset behind the mountains.'"
        maxLength={5000}
      />

      {/* Split controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSplit}
          disabled={splitScenes.isPending || !storyPrompt.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {splitScenes.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Split into Scenes
        </button>

        <div className="flex items-center gap-2">
          <label className="text-xs text-txt-muted">Scenes:</label>
          <select
            value={numScenes}
            onChange={(e) => setNumScenes(Number(e.target.value))}
            className="bg-bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-txt-primary focus:outline-none focus:border-accent/50"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {scenes.length > 0 && (
          <span className="text-xs text-txt-muted ml-auto">
            Total: ~{totalDuration}s video
          </span>
        )}
      </div>

      {/* Scenes Editor */}
      {scenes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-txt-secondary">Scenes</h3>
          <AnimatePresence mode="popLayout">
            {scenes.map((scene, index) => (
              <motion.div
                key={`scene-${index}`}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-txt-muted/30 cursor-grab" />
                    <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-md">
                      Scene {index + 1}
                    </span>
                    <select
                      value={scene.duration}
                      onChange={(e) => updateDuration(index, Number(e.target.value))}
                      disabled={isGenerating}
                      className="bg-bg-elevated border border-border rounded-md px-2 py-1 text-xs text-txt-secondary focus:outline-none disabled:opacity-50"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                        <option key={d} value={d}>{d}s</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeScene(index)}
                    disabled={isGenerating || scenes.length <= 2}
                    className="p-1.5 rounded-md text-txt-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Delete scene"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={scene.prompt}
                  onChange={(e) => updateScene(index, e.target.value.slice(0, 2000))}
                  rows={2}
                  disabled={isGenerating}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs font-mono text-txt-primary placeholder:text-txt-muted resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all disabled:opacity-50"
                  placeholder={`Describe scene ${index + 1}...`}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            onClick={addScene}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-txt-muted hover:text-txt-secondary hover:bg-bg-card transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Scene
          </button>
        </div>
      )}

      {/* Model & Settings */}
      {scenes.length > 0 && (
        <>
          <ModelSelector
            type="text2video"
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />

          <div className="flex gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-txt-muted">Aspect Ratio</label>
              <div className="flex gap-1.5">
                {["16:9", "9:16", "1:1"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      aspectRatio === r
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "bg-bg-elevated text-txt-muted border border-transparent"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-txt-muted">Quality</label>
              <div className="flex gap-1.5">
                {["standard", "hd"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                      quality === q
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "bg-bg-elevated text-txt-muted border border-transparent"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          {sceneJobs.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={generateMulti.isPending || isGenerating || scenes.length < 2}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-accent"
            >
              {generateMulti.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Clapperboard className="w-4 h-4" />
              )}
              {generateMulti.isPending
                ? "Submitting scenes..."
                : `Generate All ${scenes.length} Scenes (~${totalDuration}s video)`}
            </button>
          )}
        </>
      )}

      {/* Scene Progress */}
      {sceneJobs.length > 0 && (
        <SceneProgressPanel sceneJobs={sceneJobs} totalDuration={totalDuration} />
      )}
    </div>
  );
}

function SceneProgressPanel({
  sceneJobs,
  totalDuration,
}: {
  sceneJobs: SceneJob[];
  totalDuration: number;
}) {
  const { allCompleted, anyFailed, completedCount, jobs } = useSceneJobStatuses(sceneJobs);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-3"
    >
      <h3 className="text-sm font-medium text-txt-secondary flex items-center gap-2">
        <Play className="w-4 h-4 text-accent" />
        Generation Progress
        <span className="text-xs text-txt-muted ml-auto">
          {completedCount}/{sceneJobs.length} completed
        </span>
      </h3>

      <div className="space-y-1.5">
        {sceneJobs.map((sj) => (
          <SceneProgress
            key={sj.jobId}
            jobId={sj.jobId}
            sceneNumber={sj.sceneNumber}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-txt-muted">
          Total: ~{totalDuration}s video
        </span>
      </div>

      {/* All completed banner */}
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-semibold text-green-400">
              All scenes completed!
            </span>
          </div>
          <div className="space-y-1.5">
            {jobs
              .filter((j) => j.outputUrl)
              .map((j) => (
                <a
                  key={j.sceneNumber}
                  href={j.outputUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-accent hover:text-accent-glow transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Scene {j.sceneNumber} video
                </a>
              ))}
          </div>
        </motion.div>
      )}

      {/* Failure notice */}
      {anyFailed && !allCompleted && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400">
            Some scenes failed. Check the job queue for details.
          </span>
        </div>
      )}
    </motion.div>
  );
}
