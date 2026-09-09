"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clapperboard,
  ArrowRight,
} from "lucide-react";
import { triggerProjectAnalysis } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type StepKey =
  | "uploading"
  | "detecting_scenes"
  | "extracting_frames"
  | "analyzing"
  | "preparing_results";

interface StepConfig {
  key: StepKey;
  label: string;
}

const STEPS: StepConfig[] = [
  { key: "uploading", label: "Uploading" },
  { key: "detecting_scenes", label: "Detecting Scenes" },
  { key: "extracting_frames", label: "Extracting Frames" },
  { key: "analyzing", label: "Analyzing" },
  { key: "preparing_results", label: "Preparing Results" },
];

export default function ProjectProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1); // Uploading is already done
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function executeProcessingPipeline() {
      try {
        // Step 1: Check project info
        const projRes = await fetch(`${API_BASE}/projects/${projectId}`);
        if (projRes.ok) {
          const projData = await projRes.json();
          if (isMounted) setProjectName(projData.name || "");
        }

        // Step 2 & 3: Video Scene Detection & Frame Extraction
        if (isMounted) setCurrentStepIndex(1); // Detecting Scenes
        const procRes = await fetch(`${API_BASE}/projects/${projectId}/process`, {
          method: "POST",
        });
        if (!procRes.ok) {
          const errData = await procRes.json().catch(() => ({}));
          throw new Error(errData.detail || "Scene detection failed");
        }

        if (isMounted) setCurrentStepIndex(2); // Extracting Frames (completed by video engine)
        // Brief visual pause so user sees frames extraction stage
        await new Promise((r) => setTimeout(r, 600));

        // Step 4: Audio + AI Analysis
        if (isMounted) setCurrentStepIndex(3); // Analyzing
        // Process audio in background if available
        await fetch(`${API_BASE}/projects/${projectId}/audio/process`, {
          method: "POST",
        }).catch(() => null);

        // Run Multimodal AI Analysis
        try {
          await triggerProjectAnalysis(projectId, { mode: "recreate" });
        } catch (aiErr: any) {
          console.warn("AI Analysis notice:", aiErr.message);
          // If no API key configured, continue gracefully to results page where scenes and frames are visible
        }

        // Step 5: Preparing Results
        if (isMounted) setCurrentStepIndex(4); // Preparing Results
        await new Promise((r) => setTimeout(r, 700));

        // Done! Navigate to results page
        if (isMounted) {
          router.replace(`/projects/${projectId}`);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "An error occurred during video processing.");
        }
      }
    }

    executeProcessingPipeline();

    return () => {
      isMounted = false;
    };
  }, [projectId, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg mx-auto bg-[#121318] border border-[#22232a] rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 mx-auto">
            <Clapperboard className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {projectName ? projectName : "Analyzing Video"}
          </h2>
          <p className="text-xs text-zinc-400">
            Deconstructing short video into scenes, frames, and cinematography prompts...
          </p>
        </div>

        {/* 5-Step Visual Progress List */}
        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div
                key={step.key}
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-[#181922] border-brand-500/60 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                    : isCompleted
                    ? "bg-[#14151b] border-[#22232a] text-zinc-300"
                    : "bg-[#0e0f13] border-[#1a1b22] text-zinc-600 opacity-60"
                }`}
              >
                {/* Status Indicator */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center text-[10px] font-mono text-zinc-500">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-sm font-medium ${
                    isCurrent
                      ? "text-white font-semibold"
                      : isCompleted
                      ? "text-zinc-200"
                      : "text-zinc-500"
                  }`}
                >
                  {step.label}
                </span>

                {/* Pulsing indicator for active step */}
                {isCurrent && (
                  <span className="ml-auto text-[11px] font-mono text-brand-400">
                    in progress...
                  </span>
                )}
                {isCompleted && (
                  <span className="ml-auto text-[11px] font-mono text-emerald-400">
                    done
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1e1f28] hover:bg-[#252733] text-white text-xs font-semibold transition-colors"
            >
              <span>Continue to Project Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
