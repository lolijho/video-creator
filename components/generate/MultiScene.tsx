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
}

function SceneProgress({ jobId, sceneNumber }: { jobId: string; sceneNumber: number }) {
  const { data: job } = useJob(jobId);
  const status = job?.status || "queued";

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-bg-elevated">
      <span className="text-xs font-medium text-txt-muted w-16">Scene {sceneNumber}</span>
      <div className="flex-1 h-1.5 bg-bg-card rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === "completed" ? "bg-accent-green" :
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
      <div className="flex items-center gap-1.5 w-24">
        {status === "completed" ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
        ) : status === "failed" ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        ) : (
          <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
        )}
        <span className={cn(
          "text-xs font-medium capitalize",
          status === "completed" ? "text-accent-green" :
          status === "failed" ? "text-red-500" :
          "text-accent"
        )}>
          {status}
        </span>
      </div>
    </div>
  );
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
          <AnimatePresence>
            {scenes.map((scene, index) => (
              <motion.div
                key={scene.sceneNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-md">
                      Scene {index + 1}
                    </span>
                    <select
                      value={scene.duration}
                      onChange={(e) => updateDuration(index, Number(e.target.value))}
                      className="bg-bg-elevated border border-border rounded-md px-2 py-1 text-xs text-txt-secondary focus:outline-none"
                    >
                      {[3, 4, 5, 6, 8, 10].map((d) => (
                        <option key={d} value={d}>{d}s</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeScene(index)}
                    className="p-1 rounded-md text-txt-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={scene.prompt}
                  onChange={(e) => updateScene(index, e.target.value)}
                  rows={2}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs font-mono text-txt-primary placeholder:text-txt-muted resize-none focus:outline-none focus:border-accent/50"
                  placeholder="Describe this scene..."
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
          <button
            onClick={handleGenerate}
            disabled={generateMulti.isPending || isGenerating}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-accent"
          >
            {generateMulti.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clapperboard className="w-4 h-4" />
            )}
            {generateMulti.isPending
              ? "Submitting..."
              : `Generate ${scenes.length} Scenes (~${totalDuration}s video)`}
          </button>
        </>
      )}

      {/* Scene Progress */}
      {sceneJobs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-txt-secondary flex items-center gap-2">
            <Play className="w-4 h-4 text-accent" />
            Generation Progress
          </h3>
          {sceneJobs.map((sj) => (
            <SceneProgress
              key={sj.jobId}
              jobId={sj.jobId}
              sceneNumber={sj.sceneNumber}
            />
          ))}
        </div>
      )}
    </div>
  );
}
