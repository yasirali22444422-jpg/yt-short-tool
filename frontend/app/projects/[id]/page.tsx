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
  Download,
  Shuffle,
  Users,
  Palette,
  Volume2,
  FileText,
} from "lucide-react";
import SceneTimeline, { SceneData } from "@/components/analysis/SceneTimeline";
import AudioAnalysisView, { AudioAnalysisData } from "@/components/analysis/AudioAnalysisView";
import AnalysisStudioView from "@/components/analysis/AnalysisStudioView";
import CharacterStyleView from "@/components/analysis/CharacterStyleView";
import BlueprintExportView from "@/components/analysis/BlueprintExportView";
import { Project, FullAnalysisPackage } from "@/types";
import { formatBytes, formatDuration } from "@/lib/utils";
import { fetchProjectAnalysis, triggerProjectAnalysis, getExportUrl } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [audioData, setAudioData] = useState<AudioAnalysisData | null>(null);
  const [analysisPackage, setAnalysisPackage] = useState<FullAnalysisPackage | null>(null);

  const [activeTab, setActiveTab] = useState<
    "overview" | "scenes" | "studio" | "characters" | "style" | "audio" | "blueprint"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
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

      // 4. Fetch full AI analysis package if available
      try {
        const aiData = await fetchProjectAnalysis(projectId);
        setAnalysisPackage(aiData);
      } catch {
        // Analysis not run yet
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

  const handleRunAIAnalysis = async () => {
    setAnalyzingAI(true);
    setError(null);
    try {
      const pkg = await triggerProjectAnalysis(projectId, {
        provider: project?.provider,
        model: project?.model,
        mode: "recreate",
      });
      setAnalysisPackage(pkg);
      await loadData();
      setActiveTab("studio");
    } catch (err: any) {
      setError(err.message || "Failed to run AI Analysis.");
    } finally {
      setAnalyzingAI(false);
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
    <div className="space-y-6 pb-16">
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
              {analysisPackage?.content_type && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/30 flex items-center gap-1.5">
                  <span className="text-zinc-400">Category:</span>
                  <span>{analysisPackage.content_type}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              ID: <span className="font-mono text-zinc-500">{project.id}</span> • Mode:{" "}
              <span className="capitalize text-zinc-300">{project.analysis_mode}</span> • Provider:{" "}
              <span className="capitalize text-zinc-300">{project.provider}</span> ({project.model})
            </p>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-surface-800 bg-surface-900 text-slate-400 hover:text-white transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Quick Export Dropdown if completed */}
          {analysisPackage && (
            <div className="flex items-center gap-1.5 bg-surface-950 p-1 rounded-xl border border-surface-800">
              <a
                href={getExportUrl(projectId, "json")}
                download
                title="Download Analysis JSON"
                className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-brand-400 transition-colors"
              >
                JSON
              </a>
              <span className="text-slate-700">|</span>
              <a
                href={getExportUrl(projectId, "markdown")}
                download
                title="Download Master Blueprint MD"
                className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-indigo-400 transition-colors"
              >
                MD
              </a>
              <span className="text-slate-700">|</span>
              <a
                href={getExportUrl(projectId, "txt")}
                download
                title="Download TXT Prompt Book"
                className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
              >
                TXT
              </a>
            </div>
          )}

          {/* Run Initial Video Processing */}
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

          {/* Run Full AI Reverse Engineering Analysis */}
          {scenes.length > 0 && (
            <button
              onClick={handleRunAIAnalysis}
              disabled={analyzingAI}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all ${
                analyzingAI ? "opacity-60 cursor-not-allowed" : "active:scale-98"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${analyzingAI ? "animate-spin" : ""}`} />
              <span>
                {analyzingAI
                  ? "Analyzing Scenes..."
                  : analysisPackage
                  ? "Re-Analyze AI Prompts"
                  : "Run AI Analysis"}
              </span>
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

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-surface-800 overflow-x-auto pb-1 text-sm">
        {[
          { id: "overview", label: "Overview", icon: FileVideo },
          { id: "scenes", label: `Scenes (${scenes.length})`, icon: Layers },
          { id: "studio", label: "Prompt Studio", icon: Sparkles },
          { id: "characters", label: "Characters & Props", icon: Users },
          { id: "style", label: "Style DNA", icon: Palette },
          { id: "audio", label: "Audio & Dialogue", icon: Volume2 },
          { id: "blueprint", label: "Master Blueprint & Export", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-surface-800 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Reference Video Player */}
          {project.video && !project.video.source_deleted && (
            <div className="p-6 rounded-2xl bg-[#121318] border border-[#22232a] space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 text-brand-500 fill-brand-500" />
                  <h3 className="text-base font-bold text-white">Source Reference Video</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {project.video.original_filename}
                </span>
              </div>
              <div className="w-full aspect-video max-h-[460px] rounded-xl bg-black overflow-hidden border border-[#1f2026] flex items-center justify-center">
                <video
                  controls
                  playsInline
                  src={`${API_BASE}/projects/${projectId}/video`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Detected Facts Card */}
          <div className="p-6 rounded-2xl bg-[#121318] border border-[#22232a] space-y-4 shadow-lg">
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

          {/* Quick AI Callout if not run */}
          {!analysisPackage && scenes.length > 0 && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-950/60 to-indigo-950/60 border border-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  Ready for AI Multimodal Reverse-Engineering
                </h4>
                <p className="text-xs text-slate-400">
                  {scenes.length} scene keyframes and audio cues have been isolated. Generate your production blueprint now.
                </p>
              </div>
              <button
                onClick={handleRunAIAnalysis}
                disabled={analyzingAI}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shrink-0"
              >
                {analyzingAI ? "Analyzing..." : "Generate AI Prompts & Blueprint"}
              </button>
            </div>
          )}

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

      {/* Tab 2: Scene Timeline */}
      {activeTab === "scenes" && (
        <SceneTimeline scenes={scenes} apiBase={API_BASE} />
      )}

      {/* Tab 3: Prompt Studio */}
      {activeTab === "studio" && (
        analysisPackage ? (
          <AnalysisStudioView
            analysis={analysisPackage}
            projectId={projectId}
            apiBase={API_BASE}
            onRefresh={loadData}
          />
        ) : (
          <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-surface-800 space-y-3">
            <Sparkles className="w-8 h-8 text-brand-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">AI Analysis Not Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run the AI analysis engine to generate scene-by-scene image prompts, I2V animations, and text-to-video directions.
            </p>
            <button
              onClick={handleRunAIAnalysis}
              disabled={analyzingAI}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              {analyzingAI ? "Analyzing..." : "Run AI Analysis"}
            </button>
          </div>
        )
      )}

      {/* Tab 4: Character & Object Registry */}
      {activeTab === "characters" && (
        analysisPackage ? (
          <CharacterStyleView analysis={analysisPackage} />
        ) : (
          <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-surface-800 space-y-3">
            <Users className="w-8 h-8 text-indigo-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">Character Bibles Not Built Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run the AI analysis to extract character IDs, facial consistency details, and prop registries.
            </p>
            <button
              onClick={handleRunAIAnalysis}
              disabled={analyzingAI}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              Run AI Analysis
            </button>
          </div>
        )
      )}

      {/* Tab 5: Global Style DNA */}
      {activeTab === "style" && (
        analysisPackage ? (
          <CharacterStyleView analysis={analysisPackage} />
        ) : (
          <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-surface-800 space-y-3">
            <Palette className="w-8 h-8 text-brand-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">Style DNA Not Synthesized Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run the AI analysis to classify visual medium, camera language, and lighting architecture.
            </p>
            <button
              onClick={handleRunAIAnalysis}
              disabled={analyzingAI}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              Run AI Analysis
            </button>
          </div>
        )
      )}

      {/* Tab 6: Audio & Dialogue */}
      {activeTab === "audio" && (
        <AudioAnalysisView
          data={audioData}
          projectId={projectId}
          apiBase={API_BASE}
          onRetry={handleProcessAudio}
          retrying={processingAudio}
        />
      )}

      {/* Tab 7: Master Blueprint & Export */}
      {activeTab === "blueprint" && (
        analysisPackage ? (
          <BlueprintExportView analysis={analysisPackage} projectId={projectId} />
        ) : (
          <div className="p-12 text-center rounded-2xl bg-surface-900/40 border border-surface-800 space-y-3">
            <FileText className="w-8 h-8 text-brand-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">Master Blueprint Not Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run AI Analysis to compile the full recreation blueprint, creative remix studio, and export packages.
            </p>
            <button
              onClick={handleRunAIAnalysis}
              disabled={analyzingAI}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              Run AI Analysis
            </button>
          </div>
        )
      )}
    </div>
  );
}
