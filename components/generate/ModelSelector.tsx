"use client";

import { useModels, type VideoModel } from "@/lib/hooks";
import { ModelCard } from "./ModelCard";

interface ModelSelectorProps {
  type: string;
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

export function ModelSelector({ type, selectedModel, onSelect }: ModelSelectorProps) {
  const { data: models, isLoading } = useModels(type);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-txt-secondary">Model</label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-bg-card skeleton-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const availableModels = models || [];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-txt-secondary">Model</label>
      {availableModels.length === 0 ? (
        <div className="text-sm text-txt-muted py-4 text-center bg-bg-card rounded-xl">
          No models available for this type
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {availableModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={selectedModel === model.id}
              onSelect={() => onSelect(model.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
