"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, FileVideo, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  accept: "image" | "video";
  onFileSelect: (file: File) => void;
  file: File | null;
  onClear: () => void;
  maxSizeMb?: number;
}

const ACCEPT_MAP = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: ".jpg,.jpeg,.png,.webp",
    label: "JPG, PNG, WebP",
    icon: ImageIcon,
  },
  video: {
    mimeTypes: ["video/mp4", "video/webm"],
    extensions: ".mp4,.webm",
    label: "MP4, WebM",
    icon: FileVideo,
  },
};

export function DropZone({
  accept,
  onFileSelect,
  file,
  onClear,
  maxSizeMb = 10,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = ACCEPT_MAP[accept];
  const Icon = config.icon;

  const validateAndSet = useCallback(
    (f: File) => {
      setError(null);
      if (!config.mimeTypes.includes(f.type)) {
        setError(`Invalid file type. Supported: ${config.label}`);
        return;
      }
      if (f.size > maxSizeMb * 1024 * 1024) {
        setError(`File must be under ${maxSizeMb}MB`);
        return;
      }

      onFileSelect(f);

      if (accept === "image") {
        const url = URL.createObjectURL(f);
        setPreview(url);
      } else {
        setPreview(null);
      }
    },
    [accept, config, maxSizeMb, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) validateAndSet(f);
    },
    [validateAndSet]
  );

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  };

  if (file) {
    return (
      <div className="relative rounded-xl border border-border bg-bg-card p-4">
        <button
          onClick={handleClear}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-bg-elevated text-txt-muted hover:text-txt-primary transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-48 object-contain rounded-lg"
          />
        ) : (
          <div className="flex items-center gap-3 py-2">
            <Icon className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm font-medium text-txt-primary">{file.name}</p>
              <p className="text-xs text-txt-muted">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-accent/50 bg-accent/5"
            : "border-border hover:border-border-hover bg-bg-card/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={config.extensions}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) validateAndSet(f);
          }}
          className="hidden"
        />

        <Upload className="w-8 h-8 text-txt-muted mx-auto mb-3" />
        <p className="text-sm text-txt-secondary mb-1">
          Drop {accept} here or click to browse
        </p>
        <p className="text-xs text-txt-muted">
          {config.label} - Max {maxSizeMb}MB
        </p>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
