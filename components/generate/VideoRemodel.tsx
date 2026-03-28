"use client";

import { useState } from "react";
import { PromptEditor } from "./PromptEditor";
import { ModelSelector } from "./ModelSelector";
import { ParameterPanel } from "./ParameterPanel";
import { DropZone } from "./DropZone";
import { useGenerateVideo2Video } from "@/lib/hooks";
import { Loader2, Wand2 } from "lucide-react";
import toast from "react-hot-toast";

export function VideoRemodel() {
  const [selectedModel, setSelectedModel] = useState("kling-v1.6-standard");
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState("standard");
  const [motionIntensity, setMotionIntensity] = useState("medium");
  const [strength, setStrength] = useState(0.5);

  const generate = useGenerateVideo2Video();

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Please upload a video");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please enter a style prompt");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("model", selectedModel);
    formData.append("prompt", prompt);
    formData.append("strength", String(strength));
    formData.append("aspectRatio", aspectRatio);
    formData.append("duration", String(duration));
    formData.append("quality", quality);

    try {
      await generate.mutateAsync(formData);
      toast.success("Video remodeling started!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="video"
        onFileSelect={setFile}
        file={file}
        onClear={() => setFile(null)}
        maxSizeMb={100}
      />

      <PromptEditor
        value={prompt}
        onChange={setPrompt}
        label="Style / Transformation Prompt"
        placeholder="Describe the style transformation: anime style, watercolor painting, cyberpunk aesthetic..."
      />

      <ModelSelector
        type="text2video"
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
        showAudio={false}
        showNegativePrompt={false}
        showStrength={true}
        strength={strength}
        onStrengthChange={setStrength}
      />

      <button
        onClick={handleGenerate}
        disabled={generate.isPending || !file || !prompt.trim()}
        className="w-full py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-accent"
      >
        {generate.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {generate.isPending ? "Submitting..." : "Remodel Video"}
      </button>
    </div>
  );
}
