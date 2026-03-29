"use client";

import { useState } from "react";
import { PromptEditor } from "./PromptEditor";
import { ModelSelector } from "./ModelSelector";
import { useGenerateImage, useModels } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Loader2, Wand2, Download, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

const RESOLUTIONS = [
  { value: "1024x1024", label: "1024 x 1024", desc: "Square" },
  { value: "1024x1792", label: "1024 x 1792", desc: "Portrait" },
  { value: "1792x1024", label: "1792 x 1024", desc: "Landscape" },
];

const QUALITIES = [
  { value: "standard", label: "Standard" },
  { value: "hd", label: "HD" },
];

const STYLES = [
  { value: "natural", label: "Natural" },
  { value: "vivid", label: "Vivid" },
];

export function ImageGen() {
  const { selectedModel, setSelectedModel } = useAppStore();
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [style, setStyle] = useState("vivid");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const generate = useGenerateImage();
  const { data: models } = useModels("image");

  // Auto-select first image model if current selection is not an image model
  const isImageModel = models?.some((m) => m.id === selectedModel);
  const effectiveModel = isImageModel ? selectedModel : models?.[0]?.id || selectedModel;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      const result = await generate.mutateAsync({
        model: effectiveModel,
        prompt,
        resolution,
        quality,
        style,
      });
      setGeneratedImageUrl(result.imageUrl);
      toast.success("Image generated!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDownload = () => {
    if (generatedImageUrl) {
      const a = document.createElement("a");
      a.href = generatedImageUrl;
      a.download = `image-${Date.now()}.png`;
      a.target = "_blank";
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <PromptEditor value={prompt} onChange={setPrompt} />

      <ModelSelector
        type="image"
        selectedModel={effectiveModel}
        onSelect={setSelectedModel}
      />

      {/* Parameters */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-medium text-txt-secondary">Parameters</h3>

        {/* Resolution */}
        <div className="space-y-2">
          <label className="text-xs text-txt-muted">Resolution</label>
          <div className="flex gap-2">
            {RESOLUTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setResolution(r.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                  resolution === r.value
                    ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                    : "bg-bg-elevated text-txt-muted hover:text-txt-secondary"
                }`}
              >
                <div>{r.desc}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div className="space-y-2">
          <label className="text-xs text-txt-muted">Quality</label>
          <div className="flex gap-2">
            {QUALITIES.map((q) => (
              <button
                key={q.value}
                onClick={() => setQuality(q.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                  quality === q.value
                    ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                    : "bg-bg-elevated text-txt-muted hover:text-txt-secondary"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div className="space-y-2">
          <label className="text-xs text-txt-muted">Style</label>
          <div className="flex gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                  style === s.value
                    ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                    : "bg-bg-elevated text-txt-muted hover:text-txt-secondary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
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
        {generate.isPending ? "Generating..." : "Generate Image"}
      </button>

      {/* Generated Image Display */}
      {generatedImageUrl && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-txt-secondary flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Generated Image
            </h3>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-bg-elevated hover:bg-bg-card text-txt-muted hover:text-txt-primary transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          <div className="rounded-xl overflow-hidden bg-bg-elevated">
            <img
              src={generatedImageUrl}
              alt="Generated image"
              className="w-full h-auto object-contain max-h-[600px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
