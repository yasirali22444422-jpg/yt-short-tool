"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Eye,
  Info,
} from "lucide-react";
import SceneTimeline, { SceneData } from "@/components/analysis/SceneTimeline";
import AudioAnalysisView, { AudioAnalysisData } from "@/components/analysis/AudioAnalysisView";
import { Project } from "@/types";
import { formatBytes, formatDuration } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [audioData, setAudioData] = useState<AudioAnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "scenes" | "characters" | "style" | "audio" | "blueprint">("overview");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch project details
      const pRes = await fetch(`${API_BASE}/projects/${projectId}`, { cache: "no-store" });
      if (!pRes.ok) throw new Error("Project not found");
      const pData: Project = await pRes.json();
      setProject(pData);

      // 2. Fetch scenes if available
      const sRes = await fetch(`${API_BASE}/projects/${projectId}/scenes`, { cache: "no-store" });
      if (sRes.ok) {
        const sData = await sRes.json();
        setScenes(sData.scenes || []);
      }

      // 3. Fetch audio analysis if available
      const aRes = await fetch(`${API_BASE}/projects/${projectId}/audio`, { cache: "no-store" });
      if (aRes.ok) {
        const aData = await aRes.json();
        setAudioData(aData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleProcessVideo = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/process`, {
        method: "POST",
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Video processing failed.");
      }
      const data = await res.json();
      await loadData();
      setActiveTab("scenes");
    } catch (err: any) {
      setError(err.message || "Error processing video.");
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessAudio = async () => {
    setProcessingAudio(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/audio/process`, {
        method: "POST",
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Audio analysis failed.");
      }
      const aData = await res.json();
      setAudioData(aData);
    } catch (err: any) {
      setError(err.message || "Error analyzing audio.");
    } finally {
      setProcessingAudio(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading project data...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-semibold text-white">Project Not Found</h2>
        <Link href="/projects" className="text-sm text-brand-400 hover:underline">
          Return to My Projects
        </Link>
      </div>
    );
  }

  const meta = project.video?.metadata;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-2 rounded-xl border border-surface-800 bg-surface-900 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {project.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {project.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ID: <span className="font-mono text-slate-500">{project.id}</span> • Mode: <span className="capitalize text-slate-300">{project.analysis_mode}</span> • AI: <span className="capitalize text-slate-300">{project.provider}</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-surface-800 bg-surface-900 text-slate-400 hover:text-white transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {project.status === "uploaded" && (
            <button
              onClick={handleProcessVideo}
              disabled={processing}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 transition-all ${
                processing ? "opacity-60 cursor-not-allowed" : "active:scale-98"
              }`}
            >
              <Play className={`w-4 h-4 ${processing ? "animate-spin" : "fill-current"}`} />
              <span>{processing ? "Processing Video..." : "Run Video Processing"}</span>
            </button>
          )}

          {project.status === "frames_extracted" && (
            <button
              onClick={handleProcessVideo}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-800 bg-surface-900 hover:bg-surface-800 text-slate-300 text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${processing ? "animate-spin" : ""}`} />
              <span>Re-run Extraction</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-surface-800 overflow-x-auto pb-1 text-sm">
        {[
          { id: "overview", label: "Overview" },
          { id: "scenes", label: `Scenes (${scenes.length})` },
          { id: "characters", label: "Characters" },
          { id: "style", label: "Style DNA" },
          { id: "audio", label: "Audio" },
          { id: "blueprint", label: "Master Blueprint" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-surface-800 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Section 15 & 47: Detected Technical Facts Card */}
          <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileVideo className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-semibold text-white">Technical Video Metadata</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Detected Fact • FFprobe
              </span>
            </div>

            {meta ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Duration</span>
                  <p className="text-base font-semibold text-white">
                    {formatDuration(meta.duration_seconds)} ({meta.duration_seconds}s)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Resolution</span>
                  <p className="text-base font-semibold text-white">
                    {meta.width} × {meta.height}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Aspect Ratio</span>
                  <p className="text-base font-semibold text-white font-mono">
                    {meta.aspect_ratio}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Framerate</span>
                  <p className="text-base font-semibold text-white">
                    {meta.fps} FPS
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Video Codec</span>
                  <p className="text-base font-semibold text-white font-mono uppercase">
                    {meta.codec}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Audio Codec</span>
                  <p className="text-base font-semibold text-white font-mono uppercase">
                    {meta.audio_codec}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-xs text-slate-400">File Size</span>
                  <p className="text-base font-semibold text-white">
                    {formatBytes(meta.file_size_bytes)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-xs text-slate-400">Detected Scenes</span>
                  <p className="text-base font-semibold text-brand-400">
                    {scenes.length} Shots
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-surface-800 rounded-xl">
                Technical metadata will be extracted when video processing is executed.
              </div>
            )}
          </div>

          {/* Quick Scene Preview */}
          {scenes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Scene Timeline Quickview</h3>
                <button
                  onClick={() => setActiveTab("scenes")}
                  className="text-xs text-brand-400 hover:underline flex items-center gap-1"
                >
                  <span>View All Scenes</span>
                </button>
              </div>
              <SceneTimeline scenes={scenes.slice(0, 3)} apiBase={API_BASE} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Scenes Timeline */}
      {activeTab === "scenes" && (
        <SceneTimeline scenes={scenes} apiBase={API_BASE} />
      )}

      {/* Placeholders for upcoming phases */}
      {activeTab === "characters" && (
        <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-surface-800 space-y-2">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">Character Bible & Registry</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Recurring character detection and consistency tracking will be activated in Phase 6.
          </p>
        </div>
      )}

      {activeTab === "style" && (
        <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-surface-800 space-y-2">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">Global Style DNA</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Lighting, color palette, medium classification, and visual aesthetics will be synthesized in Phase 5.
          </p>
        </div>
      )}

      {activeTab === "audio" && (
        <AudioAnalysisView
          data={audioData}
          projectId={projectId}
          apiBase={API_BASE}
          onRetry={handleProcessAudio}
          retrying={processingAudio}
        />
      )}

      {activeTab === "blueprint" && (
        <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-surface-800 space-y-2">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">Master Recreation Blueprint</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Prompt compiler, multi-target generation prompts, and export options will be compiled in Phase 7.
          </p>
        </div>
      )}
    </div>
  );
}
