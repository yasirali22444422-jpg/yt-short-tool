"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  Shuffle,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import { FullAnalysisPackage } from "@/types";
import { getExportUrl } from "@/lib/api";

interface Props {
  analysis: FullAnalysisPackage;
  projectId: string;
}

export default function BlueprintExportView({ analysis, projectId }: Props) {
  const [viewMode, setViewMode] = useState<"blueprint" | "remix">("blueprint");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const remix = analysis.remix_data;

  return (
    <div className="space-y-6">
      {/* Export & Actions Toolbar */}
      <div className="p-4 rounded-2xl bg-surface-900/60 border border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-white">Export & Recreation Studio</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Download full recreation blueprints or prompt books in JSON, Markdown, and TXT.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Download JSON */}
          <a
            href={getExportUrl(projectId, "json")}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 hover:bg-surface-800 text-slate-200 text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span>JSON</span>
          </a>

          {/* Download Markdown */}
          <a
            href={getExportUrl(projectId, "markdown")}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 hover:bg-surface-800 text-slate-200 text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Markdown</span>
          </a>

          {/* Download TXT Prompt Book */}
          <a
            href={getExportUrl(projectId, "txt")}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 hover:bg-surface-800 text-slate-200 text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>TXT Prompts</span>
          </a>

          {/* Copy Blueprint */}
          <button
            onClick={() => handleCopy(analysis.blueprint_markdown, "blueprint")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors shadow-sm shadow-brand-500/20"
          >
            {copied === "blueprint" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Blueprint</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode Switcher: Recreate vs Remix */}
      <div className="flex items-center gap-2 border-b border-surface-800 pb-2">
        <button
          onClick={() => setViewMode("blueprint")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            viewMode === "blueprint"
              ? "bg-surface-800 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4 text-brand-400" />
          <span>Recreation Blueprint</span>
        </button>

        {remix && (
          <button
            onClick={() => setViewMode("remix")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              viewMode === "remix"
                ? "bg-surface-800 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Shuffle className="w-4 h-4 text-indigo-400" />
            <span>Creative Remix Studio</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
              AI Remix
            </span>
          </button>
        )}
      </div>

      {/* Blueprint View */}
      {viewMode === "blueprint" && (
        <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-800/80 pb-3">
            <span className="text-xs text-slate-400 font-mono">
              Format: Markdown • {analysis.scenes.length} Scenes Compiled
            </span>
            <button
              onClick={() => handleCopy(analysis.blueprint_markdown, "blueprint_inner")}
              className="text-xs text-brand-400 hover:underline flex items-center gap-1"
            >
              {copied === "blueprint_inner" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === "blueprint_inner" ? "Copied" : "Copy Raw Markdown"}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-surface-950 border border-surface-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all max-h-[700px]">
            {analysis.blueprint_markdown}
          </pre>
        </div>
      )}

      {/* Remix Studio View */}
      {viewMode === "remix" && remix && (
        <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-6">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Creative Concept: {remix.remix_concept}</h3>
            </div>
            <p className="text-xs text-slate-300">
              Transforms the original video's camera cadence, shot sizes, and emotional beats into a fresh {remix.target_genre} narrative.
            </p>
          </div>

          {/* Remixed Scenes */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white">Remixed Scene Prompts</h4>
            <div className="space-y-4">
              {remix.remixed_scenes.map((rs: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-950 border border-surface-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">
                      Remixed Scene {rs.scene_number.toString().padStart(2, "0")} ({rs.duration}s)
                    </span>
                    <button
                      onClick={() => handleCopy(rs.remixed_t2v_prompt, `remix_${idx}`)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      {copied === `remix_${idx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied === `remix_${idx}` ? "Copied" : "Copy Video Prompt"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{rs.remix_summary}</p>
                  <div className="p-3 rounded-lg bg-surface-900 border border-surface-800 font-mono text-xs text-slate-200 break-words">
                    {rs.remixed_t2v_prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
