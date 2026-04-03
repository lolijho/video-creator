"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useGenerateTTS } from "@/lib/hooks";
import { Loader2, Wand2, Play, Pause, Download, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const VOICES = [
  { id: "if_sara", label: "Sara", gender: "Female", color: "from-purple-500/20 to-pink-500/20", borderColor: "border-purple-500/50" },
  { id: "im_nicola", label: "Nicola", gender: "Male", color: "from-blue-500/20 to-cyan-500/20", borderColor: "border-blue-500/50" },
] as const;

const MAX_CHARS = 2500;

function WaveformVisual({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-12 px-4">
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] rounded-full bg-accent/70 transition-all duration-150",
            isPlaying ? "animate-pulse" : ""
          )}
          style={{
            height: isPlaying
              ? `${12 + Math.sin(i * 0.7) * 16 + Math.random() * 12}px`
              : `${4 + Math.sin(i * 0.5) * 6}px`,
            animationDelay: `${i * 50}ms`,
            animationDuration: `${300 + Math.random() * 400}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function TextToSpeech() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<string>("if_sara");
  const [speed, setSpeed] = useState(1.0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generate = useGenerateTTS();

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to convert");
      return;
    }

    try {
      const result = await generate.mutateAsync({
        prompt: text.trim(),
        voice,
        speed,
      });
      setAudioUrl(result.audioUrl);
      toast.success("Audio generated successfully!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `tts-${Date.now()}.mp3`;
    a.click();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  return (
    <div className="space-y-6">
      {/* Text Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-txt-secondary">
            Text to Convert
          </label>
          <span
            className={cn(
              "text-xs",
              text.length > MAX_CHARS ? "text-red-400" : "text-txt-muted"
            )}
          >
            {text.length} / {MAX_CHARS}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Enter Italian text to convert to speech..."
          rows={6}
          className="w-full rounded-xl border border-border bg-bg-card/50 px-4 py-3 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all duration-200 resize-none"
        />
      </div>

      {/* Voice Selector */}
      <div>
        <label className="text-sm font-medium text-txt-secondary block mb-3">
          Voice
        </label>
        <div className="grid grid-cols-2 gap-3">
          {VOICES.map((v) => {
            const isSelected = voice === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setVoice(v.id)}
                className={cn(
                  "relative rounded-xl border-2 p-4 text-left transition-all duration-200",
                  isSelected
                    ? `${v.borderColor} bg-gradient-to-br ${v.color}`
                    : "border-border hover:border-border-hover bg-bg-card/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
                      isSelected
                        ? "bg-white/10 text-white"
                        : "bg-bg-elevated text-txt-muted"
                    )}
                  >
                    {v.label[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-txt-primary">
                      {v.label}
                    </p>
                    <p className="text-xs text-txt-muted">{v.gender}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-txt-secondary">
            Speed
          </label>
          <span className="text-sm font-mono text-accent">{speed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full accent-accent h-2 rounded-full appearance-none bg-bg-elevated cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-lg"
        />
        <div className="flex justify-between text-[10px] text-txt-muted mt-1">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>1.5x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generate.isPending || !text.trim() || text.length > MAX_CHARS}
        className="w-full py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-accent"
      >
        {generate.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {generate.isPending ? "Generating Audio..." : "Generate Audio"}
      </button>

      {/* Audio Player */}
      {audioUrl && (
        <div className="rounded-xl border border-border bg-bg-card/80 p-5 space-y-4">
          <audio ref={audioRef} src={audioUrl} preload="auto" />

          {/* Waveform */}
          <WaveformVisual isPlaying={isPlaying} />

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-accent hover:bg-accent-glow text-white transition-all duration-200 shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2.5 rounded-full bg-bg-elevated hover:bg-bg-card text-txt-secondary hover:text-txt-primary transition-all duration-200 border border-border"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-txt-muted">
            <Volume2 className="w-3.5 h-3.5" />
            <span>
              {VOICES.find((v) => v.id === voice)?.label} - {speed.toFixed(1)}x
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
