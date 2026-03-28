"use client";

import { useState } from "react";
import { PromptEditor } from "./PromptEditor";
import { ModelSelector } from "./ModelSelector";
import { ParameterPanel } from "./ParameterPanel";
import { DropZone } from "./DropZone";
import { useGenerateImage2Video, useModels } from "@/lib/hooks";
import { Loader2, Wand2 } from "lucide-react";
import toast from "react-hot-toast";

export function ImageToVideo() {
  const [selectedModel, setSelectedModel] = useState("veo-2");
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [motionPrompt, setMotionPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState("standard");
  const [motionIntensity, setMotionIntensity] = useState("medium");
  const [seed, setSeed] = useState<number | undefined>();

  const generate = useGenerateImage2Video();
  const { data: models } = useModels("image2video");
  const currentModel = models?.find((m) => m.id === selectedModel);

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Please upload an image");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("model", selectedModel);
    if (prompt) formData.append("prompt", prompt);
    if (motionPrompt) formData.append("motionPrompt", motionPrompt);
    formData.append("aspectRatio", aspectRatio);
    formData.append("duration", String(duration));
    formData.append("quality", quality);
    formData.append("motionIntensity", motionIntensity);
    if (seed !== undefined) formData.append("seed", String(seed));

    try {
      await generate.mutateAsync(formData);
      toast.success("Image-to-video generation started!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="image"
        onFileSelect={setFile}
        file={file}
        onClear={() => setFile(null)}
        maxSizeMb={10}
      />

      <PromptEditor
        value={prompt}
        onChange={setPrompt}
        label="Animation Prompt (optional)"
        placeholder="Describe how the image should animate..."
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-txt-secondary">
          Motion Description (optional)
        </label>
        <textarea
          value={motionPrompt}
          onChange={(e) => setMotionPrompt(e.target.value)}
          placeholder="Describe specific motion: camera zoom, pan left, character walking..."
          rows={2}
          className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm font-mono text-txt-primary placeholder:text-txt-muted resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
        />
      </div>

      <ModelSelector
        type="image2video"
        selectedModel={selectedModel}
        onSelect={setSelectedModel}
      />

      <ParameterPanel
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        duration={duration}
        onDurationChange={setDuration}
        quality={quality}
        onQualityChange={setQuality}
        motionIntensity={motionIntensity}
        onMotionIntensityChange={setMotionIntensity}
        seed={seed}
        onSeedChange={setSeed}
        showAudio={false}
        showNegativePrompt={false}
        maxDuration={currentModel?.metadata.maxDuration ?? 10}
      />

      <button
        onClick={handleGenerate}
        disabled={generate.isPending || !file}
        className="w-full py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-accent"
      >
        {generate.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {generate.isPending ? "Submitting..." : "Animate Image"}
      </button>
    </div>
  );
}
