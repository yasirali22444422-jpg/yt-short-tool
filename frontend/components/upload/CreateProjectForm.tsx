"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileVideo, AlertCircle, Loader2 } from "lucide-react";
import { uploadVideoWithProgress } from "@/lib/api";

export default function CreateProjectForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
      setError("Please upload an MP4, MOV, or WEBM video.");
      return;
    }

    const maxBytes = 100 * 1024 * 1024; // 100MB limit
    if (file.size > maxBytes) {
      setError("Video file size exceeds the 100MB limit.");
      return;
    }

    setSelectedFile(file);
    if (!projectName.trim()) {
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

  const handleCreateAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Please enter a project name.");
      return;
    }
    if (!selectedFile) {
      setError("Please drop or select a short video file.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", projectName.trim());
    formData.append("analysis_mode", "detailed");
    formData.append("provider", "gemini");

    try {
      const res = await uploadVideoWithProgress(formData, (percent) => {
        setProgress(percent);
      });

      // Immediately navigate to dedicated 5-step processing screen
      router.push(`/projects/${res.project_id}/processing`);
    } catch (err: any) {
      setError(err.message || "Failed to upload video. Please check your connection.");
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6 sm:py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Create New Project
        </h1>
      </div>

      <form onSubmit={handleCreateAndAnalyze} className="space-y-6">
        {/* Required Project Name field */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Project Name <span className="text-brand-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Cyberpunk Street Scene"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={uploading}
            className="w-full px-4 py-3 rounded-xl bg-[#121318] border border-[#22232a] text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
        </div>

        {/* Large Drag-and-Drop Upload Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
              : selectedFile
              ? "border-brand-500/60 bg-[#16171f]"
              : "border-[#272832] bg-[#121318] hover:border-zinc-700 hover:bg-[#15161c]"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".mp4,.mov,.webm"
            disabled={uploading}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                selectedFile
                  ? "bg-brand-500/20 text-brand-400 border border-brand-500/40"
                  : "bg-[#1b1c24] text-zinc-400 border border-[#2c2d38]"
              }`}
            >
              {selectedFile ? (
                <FileVideo className="w-7 h-7" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className="text-base font-semibold text-white">
                {selectedFile ? selectedFile.name : "Drop your short video here"}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB selected • Click to change`
                  : "MP4, MOV or WEBM • Up to 90 seconds"}
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Progress Bar (if active) */}
        {uploading && (
          <div className="space-y-2 p-4 rounded-xl bg-[#121318] border border-[#22232a]">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-2 text-brand-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading video...
              </span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#1f2028] rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-300 shadow-[0_0_8px_#f97316]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Single Primary Orange Button */}
        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-600/20 hover:shadow-brand-600/30 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Starting Analysis...</span>
            </>
          ) : (
            <span>Create Project & Analyze</span>
          )}
        </button>
      </form>
    </div>
  );
}
