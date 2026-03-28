"use client";

import { useState, useRef } from "react";
import {
  Play,
  Pause,
  Maximize2,
  Download,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress(
      (videoRef.current.currentTime / videoRef.current.duration) * 100
    );
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen();
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = "video.mp4";
    a.click();
  };

  return (
    <div className={cn("relative group rounded-xl overflow-hidden bg-black", className)}>
      <video
        ref={videoRef}
        src={src}
        muted={isMuted}
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
      />

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <div className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="flex-1" />

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
