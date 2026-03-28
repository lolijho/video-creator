"use client";

import { useState } from "react";
import { PromptEditor } from "./PromptEditor";
import { ModelSelector } from "./ModelSelector";
import { ParameterPanel } from "./ParameterPanel";
import { useGenerateText2Video, useModels } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Loader2, Wand2 } from "lucide-react";
import toast from "react-hot-toast";

export function TextToVideo() {
  const { selectedModel, setSelectedModel } = useAppStore();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState("standard");
  const [motionIntensity, setMotionIntensity] = useState("medium");
  const [seed, setSeed] = useState<number | undefined>();
  const [withAudio, setWithAudio] = useState(false);

  const generate = useGenerateText2Video();
  const { data: models } = useModels("text2video");

  const currentModel = models?.find((m) => m.id === selectedModel);
  const showAudio = currentModel?.metadata.supportsAudio ?? false;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      await generate.mutateAsync({
        model: selectedModel,
        prompt,
        negativePrompt: negativePrompt || undefined,
        aspectRatio,
        duration,
        quality,
        motionIntensity,
        seed,
        withAudio,
      });
      toast.success("Video generation started!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <PromptEditor value={prompt} onChange={setPrompt} />

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
        negativePrompt={negativePrompt}
        onNegativePromptChange={setNegativePrompt}
        seed={seed}
        onSeedChange={setSeed}
        withAudio={withAudio}
        onWithAudioChange={setWithAudio}
        showAudio={showAudio}
        maxDuration={currentModel?.metadata.maxDuration ?? 10}
      />

      <button
        onClick={handleGenerate}
        disabled={generate.isPending || !prompt.trim()}
        className="w-full py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-accent"
      >
        {generate.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {generate.isPending ? "Submitting..." : "Generate Video"}
      </button>
    </div>
  );
}
