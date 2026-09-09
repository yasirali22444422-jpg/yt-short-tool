"use client";

import React, { useState } from "react";
import {
  Mic,
  Music,
  Volume2,
  Copy,
  Check,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string | null;
}

export interface SoundEffectCue {
  timestamp: number;
  duration: number;
  label: string;
  confidence: number;
}

export interface MusicAnalysis {
  has_music: boolean;
  mood: string;
  intensity: string;
  tempo_feel: string;
  dramatic_changes: string[];
}

export interface AudioAnalysisData {
  has_audio: boolean;
  has_speech: boolean;
  full_transcript: string;
  segments: TranscriptSegment[];
  sfx_cues: SoundEffectCue[];
  music: MusicAnalysis;
  audio_file_url?: string | null;
}

interface AudioAnalysisViewProps {
  data: AudioAnalysisData | null;
  projectId: string;
  apiBase: string;
  onRetry: () => void;
  retrying?: boolean;
}

export default function AudioAnalysisView({
  data,
  projectId,
  apiBase,
  onRetry,
  retrying = false,
}: AudioAnalysisViewProps) {
  const [copied, setCopied] = useState(false);

  const cleanBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;

  const handleCopy = () => {
    if (data?.full_transcript) {
      navigator.clipboard.writeText(data.full_transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!data || !data.has_audio) {
    return (
      <div className="p-8 text-center rounded-2xl bg-surface-900/40 border border-surface-800 space-y-4">
        <Volume2 className="w-10 h-10 text-slate-500 mx-auto" />
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-white">No Audio Track Detected</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            This video appears to be silent or has no recognizable audio stream.
          </p>
        </div>
        <button
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
          <span>{retrying ? "Analyzing Audio..." : "Retry Audio Extraction"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audio Header & Preview Player */}
      <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-semibold text-white">Extracted Audio Track</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              16kHz PCM • Whisper Processed
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Listen to isolated audio channel and inspect speech transcription.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {data.audio_file_url && (
            <audio
              controls
              src={`${cleanBase}${data.audio_file_url}`}
              className="h-9 rounded-lg max-w-xs"
            />
          )}
          <button
            onClick={onRetry}
            disabled={retrying}
            className="p-2.5 rounded-xl border border-surface-800 bg-surface-950 text-slate-400 hover:text-white transition-colors"
            title="Re-run audio analysis"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin text-brand-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid: Speech Transcript & Music/SFX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dialogue / Speech Transcript */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-brand-400" />
                <h4 className="text-sm font-semibold text-white">Dialogue & Speech Transcript</h4>
              </div>
              {data.has_speech && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-surface-950 border border-surface-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Full"}</span>
                </button>
              )}
            </div>

            {data.has_speech && data.segments.length > 0 ? (
              <div className="space-y-3">
                {/* Segmented Timeline */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {data.segments.map((seg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-brand-400">
                          <Clock className="w-3 h-3" />
                          {formatDuration(seg.start)} → {formatDuration(seg.end)}
                        </span>
                        {seg.speaker && (
                          <span className="text-slate-500 font-sans">
                            {seg.speaker}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        "{seg.text}"
                      </p>
                    </div>
                  ))}
                </div>

                {/* Full Transcript Box */}
                <div className="p-3.5 rounded-xl bg-surface-950/50 border border-surface-800/50 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Combined Script
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{data.full_transcript}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-surface-800 rounded-xl space-y-1">
                <p className="text-slate-300 font-medium">No spoken dialogue detected.</p>
                <p className="text-slate-500">
                  This short appears to be instrumental, music-driven, or purely ambient sound effects.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Music Mood & Sound Effects */}
        <div className="space-y-4">
          {/* Music Analysis Card */}
          <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-4">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-semibold text-white">Music & Mood</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-950 border border-surface-800/80">
                <span className="text-slate-400">Music Presence:</span>
                <span className="font-semibold text-white">
                  {data.music.has_music ? "Detected" : "None / Ambient"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-950 border border-surface-800/80">
                <span className="text-slate-400">Mood Feel:</span>
                <span className="font-semibold capitalize text-indigo-300">
                  {data.music.mood}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-950 border border-surface-800/80">
                <span className="text-slate-400">Tempo Pace:</span>
                <span className="font-semibold capitalize text-slate-200">
                  {data.music.tempo_feel}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-950 border border-surface-800/80">
                <span className="text-slate-400">Audio Intensity:</span>
                <span className="font-semibold capitalize text-brand-400">
                  {data.music.intensity}
                </span>
              </div>
            </div>
          </div>

          {/* Sound Effects (SFX) Cues */}
          <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-white">
                  SFX Cues ({data.sfx_cues.length})
                </h4>
              </div>
              <span className="text-[10px] text-slate-500">Acoustic transients</span>
            </div>

            {data.sfx_cues.length > 0 ? (
              <div className="space-y-2">
                {data.sfx_cues.map((cue, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-950/80 border border-surface-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 text-[11px]">
                        {formatDuration(cue.timestamp)}
                      </span>
                      <span className="font-medium text-slate-200 capitalize">
                        {cue.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {Math.round(cue.confidence * 100)}% conf
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-3">
                No high-impact sound effect transients detected.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
