"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Trash2,
  Clock,
  HardDrive,
  RefreshCw,
  Plus,
  AlertCircle,
  FileVideo,
  ChevronRight,
} from "lucide-react";
import { fetchProjects, deleteProject } from "@/lib/api";
import { ProjectListItem } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this project and its video?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Completed
          </span>
        );
      case "uploaded":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Uploaded
          </span>
        );
      case "failed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-brand-400" />
            My Projects
          </h1>
          <p className="text-sm text-slate-400">
            Manage your analyzed videos, blueprints, and production drafts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProjects}
            disabled={loading}
            className="p-2.5 rounded-xl border border-surface-800 bg-surface-900 text-slate-400 hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-400" : ""}`} />
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Video Analysis</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading your projects...</p>
        </div>
      ) : projects.length === 0 ? (
        /* Empty state */
        <div className="py-20 text-center space-y-4 border border-surface-800 rounded-2xl bg-surface-900/30">
          <div className="w-16 h-16 rounded-2xl bg-surface-800 text-slate-500 flex items-center justify-center mx-auto">
            <FileVideo className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No projects found</h3>
            <p className="text-sm text-slate-400">
              Upload your first short video reference to generate an AI blueprint.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload a Video</span>
          </Link>
        </div>
      ) : (
        /* Projects List */
        <div className="grid grid-cols-1 gap-3">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/projects/${proj.id}`}
              className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-surface-900/60 border border-surface-800 hover:border-slate-700 hover:bg-surface-900 transition-all group block cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-surface-800 text-brand-400 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500/10 group-hover:scale-105 transition-all">
                  <FileVideo className="w-6 h-6" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                      {proj.name}
                    </h3>
                    {getStatusBadge(proj.status)}
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {formatDate(proj.created_at)}
                    </span>
                    {proj.video_size_mb !== null && (
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                        {proj.video_size_mb} MB
                      </span>
                    )}
                    <span className="capitalize text-slate-500">
                      Mode: <span className="text-slate-400">{proj.analysis_mode}</span>
                    </span>
                    <span className="capitalize text-slate-500">
                      AI: <span className="text-slate-400">{proj.provider}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <button
                  onClick={(e) => handleDelete(proj.id, e)}
                  disabled={deletingId === proj.id}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="w-7 h-7 rounded-lg bg-surface-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
