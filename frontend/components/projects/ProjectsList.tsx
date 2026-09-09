"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, FileVideo, Film, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { fetchProjects } from "@/lib/api";
import { ProjectListItem } from "@/types";
import { formatDate } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function ProjectsList({ onEmpty }: { onEmpty?: () => void }) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data);
      if (data.length === 0 && onEmpty) {
        onEmpty();
      }
    } catch (err: any) {
      setError(err.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </span>
        );
      case "uploaded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Uploaded
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500 font-medium">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md mx-auto space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm font-semibold text-rose-300">{error}</p>
        <button
          onClick={loadProjects}
          className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-xs font-semibold text-rose-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with single "+ New Project" button */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#1f2026]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            My Projects
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {projects.length} {projects.length === 1 ? "project" : "projects"} saved
          </p>
        </div>

        <Link
          href="/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Project</span>
        </Link>
      </div>

      {/* Clean Project Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group flex flex-col justify-between rounded-2xl border border-[#22232a] bg-[#121318] hover:border-brand-500/50 hover:bg-[#15161d] transition-all p-4 shadow-lg"
          >
            {/* Thumbnail preview area */}
            <div className="w-full aspect-video rounded-xl bg-[#0b0c0e] border border-[#1f2026] relative overflow-hidden flex items-center justify-center group-hover:border-[#2f303a] transition-colors">
              <div className="flex flex-col items-center gap-2 text-zinc-600 group-hover:text-brand-500 transition-colors">
                <Film className="w-8 h-8" />
              </div>

              {/* Status pill overlay */}
              <div className="absolute top-2.5 right-2.5">
                {getStatusBadge(project.status)}
              </div>
            </div>

            {/* Project Details: Name, Date, Status */}
            <div className="mt-4 space-y-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-brand-400 transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-[#1a1b22]">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {formatDate(project.created_at)}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {project.video_size_mb ? `${project.video_size_mb.toFixed(1)} MB` : ""}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
