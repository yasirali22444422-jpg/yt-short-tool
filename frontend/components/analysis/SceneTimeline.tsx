"use client";

import React from "react";
import { Film, Clock, Image as ImageIcon, Layers } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface ExtractedFrame {
  frame_type: string;
  timestamp: number;
  file_path: string;
  relative_url: string;
}

export interface SceneData {
  scene_number: number;
  start_time: number;
  end_time: number;
  duration: number;
  frames?: ExtractedFrame[] | null;
  keyframe_urls?: string[];
  frame_count?: number;
  thumbnail_url?: string | null;
}

interface SceneTimelineProps {
  scenes: SceneData[];
  apiBase: string;
}

export default function SceneTimeline({ scenes, apiBase }: SceneTimelineProps) {
  if (!scenes || scenes.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-surface-900/40 border border-surface-800 space-y-2">
        <Film className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-semibold text-white">No scenes detected yet</h4>
        <p className="text-xs text-slate-400">
          Run video processing to segment shots and extract keyframes.
        </p>
      </div>
    );
  }

  const cleanBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-400" />
          <h3 className="text-base font-semibold text-white">
            Detected Shots & Timeline ({scenes.length} Scenes)
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Smart Keyframes: Start, Middle, End + Motion
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {scenes.map((scene) => {
          // Normalize frames list safely: handle missing, null, or keyframe_urls fallback
          const rawFrames: ExtractedFrame[] = Array.isArray(scene?.frames)
            ? scene.frames
            : Array.isArray((scene as any)?.keyframe_urls)
            ? (scene as any).keyframe_urls.map((url: string, idx: number) => ({
                frame_type: "keyframe",
                timestamp: scene.start_time || 0,
                file_path: "",
                relative_url: url,
              }))
            : [];

          const frameCount = scene.frame_count ?? rawFrames.length;

          return (
            <div
              key={scene.scene_number}
              className="p-5 rounded-2xl bg-surface-900/70 border border-surface-800 hover:border-slate-700 transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-surface-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold text-xs">
                    SCENE {String(scene.scene_number).padStart(2, "0")}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {formatDuration(scene.start_time || 0)} → {formatDuration(scene.end_time || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-800 text-slate-300">
                    Duration: {scene.duration ?? 0}s
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-800 text-slate-300">
                    {frameCount} Keyframe{frameCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Keyframes Gallery */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Extracted Keyframes
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Perceptually deduplicated
                  </span>
                </div>

                {rawFrames.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {rawFrames.map((frame, fIdx) => {
                      const imgUrl = `${cleanBase}${frame.relative_url}`;
                      return (
                        <div
                          key={fIdx}
                          className="group relative rounded-xl overflow-hidden border border-surface-800 bg-surface-950 aspect-[9/16] sm:aspect-video flex items-center justify-center shadow-inner"
                        >
                          <img
                            src={imgUrl}
                            alt={`Scene ${scene.scene_number} ${frame.frame_type}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-[10px] text-white">
                            <span className="capitalize font-medium">{frame.frame_type}</span>
                            <span className="font-mono text-slate-300">{frame.timestamp}s</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-surface-950/60 border border-dashed border-surface-800 text-center text-xs text-slate-400">
                    No frames extracted for this scene
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
