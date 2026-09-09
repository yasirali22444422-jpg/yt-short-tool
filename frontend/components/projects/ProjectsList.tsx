"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, Film, AlertCircle } from "lucide-react";

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

  if (loading) {

    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-7 h-7 border-2 border-[#ff5500] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-medium">Loading projects...</p>
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
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#181920]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            My Projects
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {projects.length} {projects.length === 1 ? "project" : "projects"} saved
          </p>
        </div>

        <Link
          href="/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff5500] hover:bg-[#e64a00] active:bg-[#cc3f00] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,85,0,0.25)] border border-[#ff7733]/30 transition-all duration-150"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ New Project</span>
        </Link>
      </div>

      {/* Clean Project Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group flex flex-col justify-between rounded-2xl border border-[#1c1d24] bg-[#0e0f14] hover:border-[#ff5500]/50 hover:bg-[#121319] hover:shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(255,85,0,0.1)] transition-all duration-200 p-4 shadow-lg"
          >
            {/* Thumbnail preview area */}
            <div className="w-full aspect-video rounded-xl bg-[#07080a] border border-[#1a1b22] relative overflow-hidden flex items-center justify-center group-hover:border-[#282934] transition-colors">
              <div className="flex flex-col items-center gap-2 text-zinc-600 group-hover:text-[#ff5500] transition-colors">
                <Film className="w-8 h-8" />
              </div>

              {/* Video Duration Badge on Thumbnail */}
              {project.formatted_duration && (
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-[11px] font-mono font-semibold text-zinc-200 border border-white/10 shadow-sm">
                  {project.formatted_duration}
                </div>
              )}
            </div>

            {/* Project Details: Name, Created Date, Video Duration */}
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-[#ff7722] transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1.5 border-t border-[#1a1b22]">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {formatDate(project.created_at)}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {project.formatted_duration ? `Duration: ${project.formatted_duration}` : ""}
                </span>
              </div>
            </div>
          </Link>
        ))}

      </div>
    </div>
  );
}
