"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileVideo,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { uploadVideoWithProgress } from "@/lib/api";
import { AnalysisMode, AIProvider } from "@/types";
import { formatBytes } from "@/lib/utils";

export default function VideoUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("detailed");
  const [provider, setProvider] = useState<AIProvider>("gemini");

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const allowedExtensions = [".mp4", ".mov", ".webm"];

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Unsupported file format. Please upload MP4, MOV, or WebM.`);
      return;
    }

    const maxBytes = 100 * 1024 * 1024; // 100MB
    if (file.size > maxBytes) {
      setError(`File size exceeds 100MB limit.`);
      return;
    }

    setSelectedFile(file);
    if (!projectName) {
      setProjectName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a video file first.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (projectName.trim()) {
      formData.append("name", projectName.trim());
    }
    formData.append("analysis_mode", analysisMode);
    formData.append("provider", provider);

    try {
      const res = await uploadVideoWithProgress(formData, (percent) => {
        setProgress(percent);
      });

      setSuccessMsg("Upload complete! Project created.");
      setTimeout(() => {
        router.push("/projects");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to upload video. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
            : selectedFile
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-surface-800 bg-surface-900/50 hover:border-slate-700 hover:bg-surface-900"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".mp4,.mov,.webm"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              selectedFile
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-surface-800 text-brand-400"
            }`}
          >
            {selectedFile ? (
              <FileVideo className="w-8 h-8" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          {selectedFile ? (
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">
                {selectedFile.name}
              </h3>
              <p className="text-sm text-slate-400">
                Size: {formatBytes(selectedFile.size)} • Click or drop another to replace
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">
                Drag & drop your short video here
              </h3>
              <p className="text-sm text-slate-400">
                or click to browse from your computer
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-800 text-slate-300">
              MP4, MOV, WebM
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-800 text-slate-300">
              1s to 90s Duration
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-800 text-slate-300">
              Max 100MB
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-900/60 border border-surface-800 rounded-2xl p-6">
        {/* Project Name & Mode */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Cyberpunk Runner Short"
              disabled={uploading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-surface-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Analysis Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "fast",
                  label: "Fast",
                  desc: "1-2 frames/scene",
                  icon: Zap,
                },
                {
                  id: "detailed",
                  label: "Detailed",
                  desc: "3-5 frames (Rec)",
                  icon: Layers,
                },
                {
                  id: "deep",
                  label: "Deep",
                  desc: "Adaptive + VFX",
                  icon: Sparkles,
                },
              ].map((m) => {
                const Icon = m.icon;
                const active = analysisMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={uploading}
                    onClick={() => setAnalysisMode(m.id as AnalysisMode)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      active
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-surface-800 bg-surface-950/60 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${active ? "text-brand-400" : "text-slate-500"}`} />
                      <span className="text-xs font-semibold">{m.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Provider & Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              AI Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "gemini", label: "Gemini", desc: "Multimodal 2.5" },
                { id: "openai", label: "OpenAI", desc: "GPT-4o Vision" },
                { id: "claude", label: "Claude", desc: "Claude 3.5 Sonnet" },
              ].map((p) => {
                const active = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={uploading}
                    onClick={() => setProvider(p.id as AIProvider)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      active
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-surface-800 bg-surface-950/60 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Cpu className={`w-3.5 h-3.5 ${active ? "text-indigo-400" : "text-slate-500"}`} />
                      <span className="text-xs font-semibold">{p.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Uses server default or your encrypted BYOK keys configured in Settings.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 text-xs text-slate-400 space-y-1.5">
            <span className="font-semibold text-slate-300 block">
              Privacy & Retention:
            </span>
            <p className="text-[11px] leading-relaxed">
              Videos are processed in isolated temporary storage. Only extracted keyframes, metadata, and production prompts are stored in your project blueprint.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="space-y-2 bg-surface-900 border border-surface-800 p-4 rounded-xl">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300">Uploading Video File...</span>
            <span className="text-brand-400">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-950 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg transition-all ${
            !selectedFile || uploading
              ? "bg-surface-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-600/20 active:scale-98"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>{uploading ? `Uploading (${progress}%)...` : "Upload & Create Project"}</span>
        </button>
      </div>
    </div>
  );
}
