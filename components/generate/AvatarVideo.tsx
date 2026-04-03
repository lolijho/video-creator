"use client";

import { useState, useCallback, useRef } from "react";
import { PromptEditor } from "./PromptEditor";
import { DropZone } from "./DropZone";
import { useGenerateAvatar } from "@/lib/hooks";
import { Loader2, Wand2, Upload, X, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const AUDIO_MIME_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp3"];
const AUDIO_EXTENSIONS = ".mp3,.wav";
const MAX_AUDIO_MB = 20;

function AudioDropZone({
  onFileSelect,
  file,
  onClear,
}: {
  onFileSelect: (file: File) => void;
  file: File | null;
  onClear: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback(
    (f: File) => {
      setError(null);
      if (!AUDIO_MIME_TYPES.includes(f.type)) {
        setError("Invalid file type. Supported: MP3, WAV");
        return;
      }
      if (f.size > MAX_AUDIO_MB * 1024 * 1024) {
        setError(`Audio file must be under ${MAX_AUDIO_MB}MB`);
        return;
      }
      const url = URL.createObjectURL(f);
      setAudioUrl(url);
      onFileSelect(f);
    },
    [onFileSelect]
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
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setError(null);
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  };

  if (file && audioUrl) {
    return (
      <div className="relative rounded-xl border border-border bg-bg-card p-4">
        <button
          onClick={handleClear}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-bg-elevated text-txt-muted hover:text-txt-primary transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <Music className="w-8 h-8 text-accent" />
          <div>
            <p className="text-sm font-medium text-txt-primary">{file.name}</p>
            <p className="text-xs text-txt-muted">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        </div>

        <audio controls className="w-full h-10" src={audioUrl}>
          Your browser does not support audio playback.
        </audio>
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
          accept={AUDIO_EXTENSIONS}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) validateAndSet(f);
          }}
          className="hidden"
        />

        <Upload className="w-8 h-8 text-txt-muted mx-auto mb-3" />
        <p className="text-sm text-txt-secondary mb-1">
          Drop audio file here or click to browse
        </p>
        <p className="text-xs text-txt-muted">
          MP3, WAV - Max {MAX_AUDIO_MB}MB
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function AvatarVideo() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");

  const generate = useGenerateAvatar();

  const handleGenerate = async () => {
    if (!imageFile) {
      toast.error("Please upload a portrait image");
      return;
    }
    if (!audioFile) {
      toast.error("Please upload an audio file");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("audio", audioFile);
    formData.append("prompt", prompt);

    try {
      await generate.mutateAsync(formData);
      toast.success("Avatar video generation started!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-txt-secondary block mb-2">
          Portrait Image (first frame)
        </label>
        <DropZone
          accept="image"
          onFileSelect={setImageFile}
          file={imageFile}
          onClear={() => setImageFile(null)}
          maxSizeMb={10}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-txt-secondary block mb-2">
          Audio File (speech)
        </label>
        <AudioDropZone
          onFileSelect={setAudioFile}
          file={audioFile}
          onClear={() => setAudioFile(null)}
        />
      </div>

      <PromptEditor
        value={prompt}
        onChange={setPrompt}
        label="Scene Prompt"
        placeholder="Describe the scene, e.g. 'The person speaks to the camera. Use a static shot.'"
      />

      <button
        onClick={handleGenerate}
        disabled={generate.isPending || !imageFile || !audioFile || !prompt.trim()}
        className="w-full py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-accent"
      >
        {generate.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {generate.isPending ? "Submitting..." : "Generate Avatar Video"}
      </button>
    </div>
  );
}
