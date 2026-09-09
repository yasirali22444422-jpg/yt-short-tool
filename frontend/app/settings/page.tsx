"use client";

import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon, Server, Shield, Video, CheckCircle2, AlertTriangle } from "lucide-react";
import { fetchSystemStatus } from "@/lib/api";
import { SystemStatus } from "@/types";

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [keepVideo, setKeepVideo] = useState(false);

  useEffect(() => {
    fetchSystemStatus()
      .then((data) => setStatus(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-brand-400" />
          Settings & Environment
        </h1>
        <p className="text-sm text-slate-400">
          Configure video retention policies, processing parameters, and system integrations.
        </p>
      </div>

      {/* Video Privacy & Retention */}
      <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-800 text-brand-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Video Privacy & Storage</h3>
            <p className="text-xs text-slate-400">Manage how uploaded reference videos are handled</p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-surface-800/80">
          <div>
            <span className="text-sm font-medium text-white block">Keep Original Video</span>
            <span className="text-xs text-slate-400">
              By default (OFF), the original video is deleted after keyframes and metadata extraction to protect privacy.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setKeepVideo(!keepVideo)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              keepVideo ? "bg-brand-600 justify-end" : "bg-surface-800 justify-start"
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>
      </div>

      {/* System & Processing Constraints */}
      <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-800 text-brand-400 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">System Diagnostics</h3>
            <p className="text-xs text-slate-400">Engine parameters and external tool detection</p>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400">Loading system status...</p>
        ) : status ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-surface-800/80 text-sm">
            <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 space-y-1">
              <span className="text-xs text-slate-400">Max Video Duration</span>
              <p className="font-semibold text-white">{status.max_video_duration_sec} Seconds (V1 Short-form)</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 space-y-1">
              <span className="text-xs text-slate-400">Max File Size</span>
              <p className="font-semibold text-white">{status.max_file_size_mb} MB</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 space-y-1">
              <span className="text-xs text-slate-400">FFmpeg Status</span>
              <div className="flex items-center gap-2">
                {status.ffmpeg.ffmpeg_installed ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending Phase 2
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 space-y-1">
              <span className="text-xs text-slate-400">Default AI Model</span>
              <p className="font-semibold text-white">{status.default_model}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-rose-400">Could not connect to backend system endpoint.</p>
        )}
      </div>
    </div>
  );
}
