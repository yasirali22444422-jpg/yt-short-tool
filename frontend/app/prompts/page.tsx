"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Download,
  Edit3,
  RefreshCw,
  Plus,
  FileCode,
  Sparkles,
  ExternalLink,
  X,
  Save,
  CheckCircle2,
  SlidersHorizontal,
  FolderOpen,
  Layers,
} from "lucide-react";
import {
  fetchPromptTemplates,
  updatePromptTemplate,
  reimportPromptLibrary,
} from "@/lib/api";
import { PromptTemplate } from "@/types";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  "ASMR & Kids Content": {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    icon: "🧠",
  },
  "Interactive Form Generators & HTML Tools": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: "⚙️",
  },
  "Industrial & Manufacturing Video Scripts": {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: "🔥",
  },
};

export default function PromptLibraryPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModalTemplate, setActiveModalTemplate] = useState<PromptTemplate | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reimporting, setReimporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPromptTemplates();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || "Failed to load prompt templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Distinct categories with counts
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return [
      { name: "All", count: templates.length },
      ...Object.entries(counts).map(([name, count]) => ({ name, count })),
    ];
  }, [templates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchCat = selectedCategory === "All" || t.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.source_file && t.source_file.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [templates, selectedCategory, searchQuery]);

  // Copy handler
  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download handler
  const handleDownload = (template: PromptTemplate) => {
    const isHtml = template.title.includes("HTML") || template.content.includes("<!DOCTYPE html>");
    const isMd = template.source_file?.endsWith(".md") || template.title.includes("ASMR");
    const ext = isHtml ? ".html" : isMd ? ".md" : ".txt";
    const filename = `${template.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50)}${ext}`;

    const blob = new Blob([template.content], {
      type: isHtml ? "text/html;charset=utf-8" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Open Edit Modal
  const openEditor = (template: PromptTemplate) => {
    setActiveModalTemplate(template);
    setEditTitle(template.title);
    setEditCategory(template.category);
    setEditDescription(template.description || "");
    setEditContent(template.content);
    setSaveSuccess(false);
  };

  // Save changes
  const handleSaveTemplate = async () => {
    if (!activeModalTemplate) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updatePromptTemplate(activeModalTemplate.id, {
        title: editTitle,
        category: editCategory,
        description: editDescription,
        content: editContent,
      });

      setTemplates((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
      setActiveModalTemplate(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save prompt changes.");
    } finally {
      setSaving(false);
    }
  };

  // Re-import from Library
  const handleReimport = async () => {
    if (!confirm("Re-sync prompt library from Yasir_Master_Prompt_Library.txt? Existing custom templates will be preserved.")) {
      return;
    }
    setReimporting(true);
    try {
      const result = await reimportPromptLibrary();
      setToastMessage(result.message);
      await loadTemplates();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to re-import library.");
    } finally {
      setReimporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Master Prompt Library
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Every prompt is split into individual editable templates, categorized, and stored permanently in the database.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={loadTemplates}
            disabled={loading}
            className="p-2.5 rounded-xl border border-surface-800 bg-surface-900 text-slate-400 hover:text-white transition-colors"
            title="Refresh templates"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-400" : ""}`} />
          </button>
          <button
            onClick={handleReimport}
            disabled={reimporting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-surface-800 bg-surface-900 hover:bg-surface-800 text-slate-200 text-xs sm:text-sm font-medium transition-all"
          >
            <Layers className="w-4 h-4 text-brand-400" />
            <span>{reimporting ? "Syncing..." : "Re-sync File"}</span>
          </button>
        </div>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const meta = CATEGORY_COLORS[cat.name];
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${
                  isSelected
                    ? "bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/20"
                    : "bg-surface-900/80 text-slate-400 border-surface-800 hover:bg-surface-800 hover:text-slate-200"
                }`}
              >
                {meta?.icon && <span>{meta.icon}</span>}
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-surface-800 text-slate-400"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates by title, keywords, or source file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-800 bg-surface-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium">Loading prompt library from database...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center">
          <p className="font-semibold">{error}</p>
          <button
            onClick={loadTemplates}
            className="mt-3 px-4 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-xs font-semibold"
          >
            Try Again
          </button>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-surface-800 bg-surface-900/20">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-medium">No prompt templates found</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => {
            const colorMeta = CATEGORY_COLORS[template.category] || {
              bg: "bg-surface-800/50",
              text: "text-slate-300",
              border: "border-surface-700",
              icon: "📄",
            };
            const lineCount = template.content.split("\n").length;
            const charCount = template.content.length.toLocaleString();

            return (
              <div
                key={template.id}
                className="group flex flex-col justify-between rounded-2xl border border-surface-800 bg-surface-900/70 hover:border-surface-700 transition-all shadow-lg hover:shadow-xl p-5 sm:p-6"
              >
                <div>
                  {/* Top Category Badge & Info */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMeta.bg} ${colorMeta.text} ${colorMeta.border}`}
                    >
                      <span>{colorMeta.icon}</span>
                      <span>{template.category}</span>
                    </span>

                    <span className="text-[11px] text-slate-500 font-mono">
                      {charCount} chars • {lineCount} lines
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-brand-300 transition-colors line-clamp-2">
                    {template.title}
                  </h3>

                  {/* Description */}
                  {template.description && (
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {template.description}
                    </p>
                  )}

                  {/* Source reference */}
                  {template.source_file && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono bg-surface-950/40 px-2.5 py-1 rounded-lg border border-surface-800/60 w-fit">
                      <FolderOpen className="w-3 h-3 text-slate-400" />
                      <span>{template.source_file}</span>
                    </div>
                  )}

                  {/* Prompt Preview Snippet */}
                  <div className="mt-4 p-3 rounded-xl bg-surface-950/80 border border-surface-800/60 text-xs font-mono text-slate-300 max-h-32 overflow-hidden relative select-none">
                    <pre className="whitespace-pre-wrap line-clamp-4 text-[11px] text-slate-400">
                      {template.content.slice(0, 300)}...
                    </pre>
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface-950 to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-6 pt-4 border-t border-surface-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => openEditor(template)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 border border-brand-500/20 text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>View & Edit</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(template.id, template.content)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                        copiedId === template.id
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-surface-800/50 border-surface-700 text-slate-300 hover:bg-surface-700"
                      }`}
                      title="Copy full prompt to clipboard"
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDownload(template)}
                      className="p-2 rounded-xl border border-surface-700 bg-surface-800/50 hover:bg-surface-700 text-slate-300 transition-colors"
                      title="Download template file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor & Detail Modal */}
      {activeModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-surface-800 flex items-center justify-between gap-4 bg-surface-950/60">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {CATEGORY_COLORS[editCategory]?.icon || "📄"}
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1">
                    {editTitle || "Edit Prompt Template"}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="font-mono text-brand-400">{editCategory}</span>
                    <span>•</span>
                    <span className="font-mono">{editContent.length.toLocaleString()} characters</span>
                    <span>•</span>
                    <span className="font-mono">{editContent.split("\n").length} lines</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(activeModalTemplate.id, editContent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-700 bg-surface-800 hover:bg-surface-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => handleDownload({ ...activeModalTemplate, title: editTitle, content: editContent })}
                  className="p-1.5 rounded-lg border border-surface-700 bg-surface-800 hover:bg-surface-700 text-slate-200 transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModalTemplate(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Editable Fields + Big Content Editor */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Template Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-700 bg-surface-950 text-white text-sm font-medium focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-700 bg-surface-950 text-white text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="ASMR & Kids Content">ASMR & Kids Content</option>
                    <option value="Interactive Form Generators & HTML Tools">Interactive Form Generators & HTML Tools</option>
                    <option value="Industrial & Manufacturing Video Scripts">Industrial & Manufacturing Video Scripts</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-700 bg-surface-950 text-white text-xs sm:text-sm focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="Summary of what this master prompt does..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Full Prompt Content (Monospace Editor)
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Original Source: {activeModalTemplate.source_file || "Database Template"}
                  </span>
                </div>
                <textarea
                  rows={18}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-4 rounded-xl border border-surface-700 bg-surface-950 text-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-brand-500 leading-relaxed resize-y min-h-[380px]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-surface-800 bg-surface-950/70 flex items-center justify-between gap-3">
              <div>
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Saved permanently to SQLite database!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModalTemplate(null)}
                  className="px-4 py-2 rounded-xl border border-surface-700 bg-surface-800 hover:bg-surface-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Changes..." : "Save to Database"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
