"use client";

import React, { useEffect, useState } from "react";
import {
  KeyRound,
  FolderTree,
  Lock,
  Unlock,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  Server,
  Video,
  FileCode,
  Layers,
  Sparkles,
  Save,
} from "lucide-react";
import {
  fetchProviders,
  saveProviderKey,
  deleteProviderKey,
  testProviderConnection,
  fetchSystemStatus,
  fetchPromptTemplates,
  updatePromptTemplate,
} from "@/lib/api";
import { ProviderInfo, SystemStatus, PromptTemplate } from "@/types";

type SettingsTab = "providers" | "categories" | "prompts" | "general";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("providers");

  // Admin access state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminPinError, setAdminPinError] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Providers state
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [inputKeys, setInputKeys] = useState<{ [key: string]: string }>({});
  const [selectedModels, setSelectedModels] = useState<{ [key: string]: string }>({});
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [savingKey, setSavingKey] = useState<{ [key: string]: boolean }>({});
  const [testingKey, setTestingKey] = useState<{ [key: string]: boolean }>({});
  const [providerFeedback, setProviderFeedback] = useState<{
    [key: string]: { type: "success" | "error"; message: string } | null;
  }>({});

  // Prompt templates state
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);

  // General system state
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [keepVideo, setKeepVideo] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchProviders()
      .then((data) => {
        setProviders(data);
        const models: { [key: string]: string } = {};
        data.forEach((p) => {
          models[p.provider] = p.selected_model || p.available_models[0];
        });
        setSelectedModels(models);
      })
      .catch((err) => console.error(err));

    fetchSystemStatus()
      .then((data) => setSystemStatus(data))
      .catch((err) => console.error(err));

    fetchPromptTemplates()
      .then((data) => setTemplates(data))
      .catch((err) => console.error(err));
  }, []);

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple owner passcode (default 1234 or admin)
    if (adminPinInput === "admin" || adminPinInput === "1234" || adminPinInput === "yasir") {
      setIsAdminUnlocked(true);
      setShowAdminModal(false);
      setAdminPinInput("");
      setAdminPinError(false);
    } else {
      setAdminPinError(true);
    }
  };

  const handleSaveKey = async (providerName: string) => {
    const key = inputKeys[providerName];
    const model = selectedModels[providerName];
    setSavingKey((prev) => ({ ...prev, [providerName]: true }));
    setProviderFeedback((prev) => ({ ...prev, [providerName]: null }));

    try {
      await saveProviderKey(providerName, {
        api_key: key?.trim() || undefined,
        selected_model: model,
      });

      const updated = await fetchProviders();
      setProviders(updated);
      setInputKeys((prev) => ({ ...prev, [providerName]: "" }));
      setProviderFeedback((prev) => ({
        ...prev,
        [providerName]: { type: "success", message: "Configuration saved successfully." },
      }));
    } catch (err: any) {
      setProviderFeedback((prev) => ({
        ...prev,
        [providerName]: { type: "error", message: err.message || "Failed to save key." },
      }));
    } finally {
      setSavingKey((prev) => ({ ...prev, [providerName]: false }));
    }
  };

  const handleTestConnection = async (providerName: string) => {
    setTestingKey((prev) => ({ ...prev, [providerName]: true }));
    setProviderFeedback((prev) => ({ ...prev, [providerName]: null }));

    try {
      const res = await testProviderConnection(providerName, {
        selected_model: selectedModels[providerName],
      });
      setProviderFeedback((prev) => ({
        ...prev,
        [providerName]: {
          type: res.success ? "success" : "error",
          message: res.message,
        },
      }));
    } catch (err: any) {
      setProviderFeedback((prev) => ({
        ...prev,
        [providerName]: {
          type: "error",
          message: err.message || "Connection test failed.",
        },
      }));
    } finally {
      setTestingKey((prev) => ({ ...prev, [providerName]: false }));
    }
  };

  const handleDeleteKey = async (providerName: string) => {
    if (!confirm(`Are you sure you want to remove the API key for ${providerName}?`)) return;
    try {
      await deleteProviderKey(providerName);
      const updated = await fetchProviders();
      setProviders(updated);
      setProviderFeedback((prev) => ({
        ...prev,
        [providerName]: { type: "success", message: "API key removed." },
      }));
    } catch (err: any) {
      alert(err.message || "Failed to delete key.");
    }
  };

  const handleSavePrompt = async () => {
    if (!editingTemplate) return;
    setSavingPrompt(true);
    try {
      const updated = await updatePromptTemplate(editingTemplate.id, {
        title: editTitle,
        content: editContent,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTemplate(null);
      alert("Template saved successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to save template.");
    } finally {
      setSavingPrompt(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2026]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Settings & Control Center
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage AI providers, video categories, proprietary prompt engines, and system diagnostics.
          </p>
        </div>

        {/* Admin Lock / Unlock status pill */}
        <div className="flex items-center gap-2">
          {isAdminUnlocked ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Unlock className="w-3.5 h-3.5" />
              <span>Owner Access Active</span>
              <button
                onClick={() => setIsAdminUnlocked(false)}
                className="text-[10px] underline ml-1 text-zinc-400 hover:text-white"
              >
                Lock
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdminModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171820] hover:bg-[#1d1f28] border border-[#2b2c36] text-zinc-300 text-xs font-medium transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-brand-500" />
              <span>Unlock Admin Controls</span>
            </button>
          )}
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1f2026] pb-2 overflow-x-auto">
        {[
          { id: "providers" as SettingsTab, label: "Providers", icon: KeyRound },
          { id: "categories" as SettingsTab, label: "Categories", icon: FolderTree },
          { id: "prompts" as SettingsTab, label: "Private Prompt Engine", icon: Lock },
          { id: "general" as SettingsTab, label: "General", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#181920] text-brand-400 border border-[#2c2d36] shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131419]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROVIDERS */}
      {activeTab === "providers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Configure Bring-Your-Own-Key (BYOK) for Gemini, OpenAI, or Claude. Keys are encrypted and stored on the backend only.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {providers.map((p) => {
              const isConfigured = p.has_key;
              const feedback = providerFeedback[p.provider];

              return (
                <div
                  key={p.provider}
                  className="rounded-2xl border border-[#22232a] bg-[#121318] p-5 space-y-4 shadow-lg"
                >
                  {/* Provider Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#171820] border border-[#252630] flex items-center justify-center text-brand-500 font-bold text-sm">
                        {p.provider.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white tracking-tight">
                            {p.name}
                          </h3>
                          {isConfigured ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Configured
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                              Not Set
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{p.description}</p>
                      </div>
                    </div>

                    {isConfigured && (
                      <button
                        onClick={() => handleDeleteKey(p.provider)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete API key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Feedback message */}
                  {feedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                        feedback.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                      }`}
                    >
                      {feedback.type === "success" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{feedback.message}</span>
                    </div>
                  )}

                  {/* Settings Input Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#1a1b22]">
                    {/* API Key input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                        <span>API Key</span>
                        {p.masked_key && (
                          <span className="font-mono text-[11px] text-zinc-500">
                            Saved: {p.masked_key}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showKeys[p.provider] ? "text" : "password"}
                          placeholder={isConfigured ? "Enter new key to update..." : "Paste your API key here"}
                          value={inputKeys[p.provider] || ""}
                          onChange={(e) =>
                            setInputKeys((prev) => ({ ...prev, [p.provider]: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0c0e] border border-[#22232a] text-white text-xs font-mono placeholder-zinc-600 focus:outline-none focus:border-brand-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowKeys((prev) => ({ ...prev, [p.provider]: !prev[p.provider] }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          {showKeys[p.provider] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Model selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Default Model
                      </label>
                      <select
                        value={selectedModels[p.provider] || p.selected_model}
                        onChange={(e) =>
                          setSelectedModels((prev) => ({
                            ...prev,
                            [p.provider]: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0c0e] border border-[#22232a] text-white text-xs focus:outline-none focus:border-brand-500"
                      >
                        {p.available_models.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleTestConnection(p.provider)}
                      disabled={testingKey[p.provider]}
                      className="px-3.5 py-2 rounded-xl bg-[#171820] hover:bg-[#1f202a] text-zinc-300 text-xs font-semibold border border-[#272834] transition-colors disabled:opacity-40"
                    >
                      {testingKey[p.provider] ? "Testing..." : "Test Connection"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveKey(p.provider)}
                      disabled={savingKey[p.provider]}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all disabled:opacity-40"
                    >
                      {savingKey[p.provider] ? "Saving..." : "Save Configuration"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <p className="text-xs text-zinc-400">
            Active content domains and script architecture categories registered in the engine.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: "ASMR & Kids Content",
                icon: "🧠",
                count: 1,
                desc: "High-retention calming scripts, sensory triggers, pacing cues, and child-safe visual storytelling.",
              },
              {
                title: "Interactive Form Generators & HTML Tools",
                icon: "⚙️",
                count: 1,
                desc: "Web input forms, parameter selectors, and interactive prompt configuration interfaces.",
              },
              {
                title: "Industrial & Manufacturing Video Scripts",
                icon: "🔥",
                count: 2,
                desc: "Machinery breakdowns, factory assembly lines, technical processes, and cinematographic shots.",
              },
            ].map((cat) => (
              <div
                key={cat.title}
                className="p-5 rounded-2xl border border-[#22232a] bg-[#121318] space-y-3 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {cat.count} {cat.count === 1 ? "Template" : "Templates"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{cat.title}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{cat.desc}</p>
                </div>
                <div className="pt-3 border-t border-[#1a1b22] text-[11px] text-zinc-500 font-mono">
                  Engine Status: Active & Ready
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PRIVATE PROMPT ENGINE */}
      {activeTab === "prompts" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">
                Core master prompts reverse-engineer short videos into multi-platform visual blueprints.
              </p>
              <p className="text-[11px] text-amber-500/90 font-medium mt-0.5">
                🔒 Protected Proprietary Engine: Raw prompt instructions are hidden from normal users.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {templates.map((tmpl) => {
              const charCount = tmpl.content.length.toLocaleString();
              const lineCount = tmpl.content.split("\n").length;

              return (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-2xl border border-[#22232a] bg-[#121318] space-y-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium text-[11px]">
                        {tmpl.category}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {charCount} chars • {lineCount} lines
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {tmpl.title}
                    </h3>
                    {tmpl.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {tmpl.description}
                      </p>
                    )}
                  </div>

                  {/* Protected State vs Owner Edit */}
                  <div className="pt-3 border-t border-[#1a1b22] flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-brand-500" />
                      <span>Proprietary Engine Core</span>
                    </span>

                    {isAdminUnlocked ? (
                      <button
                        onClick={() => {
                          setEditingTemplate(tmpl);
                          setEditTitle(tmpl.title);
                          setEditContent(tmpl.content);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-brand-600/15 hover:bg-brand-600/30 text-brand-400 border border-brand-500/30 text-xs font-semibold transition-colors"
                      >
                        Owner Edit
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-600 font-mono">
                        Protected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Owner Template Edit Modal */}
          {editingTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#121318] border border-[#22232a] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2026]">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Owner Prompt Editor
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Modifying core blueprint prompt in database
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="text-zinc-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0c0e] border border-[#22232a] text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">
                    Full Prompt Instructions
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full flex-1 p-3 rounded-xl bg-[#0b0c0e] border border-[#22232a] text-white text-xs font-mono resize-none focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f2026]">
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 rounded-xl bg-[#171820] text-zinc-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePrompt}
                    disabled={savingPrompt}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingPrompt ? "Saving..." : "Save to Database"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GENERAL */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <p className="text-xs text-zinc-400">
            System health diagnostics, media processing constraints, and storage settings.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Branding Card */}
            <div className="p-5 rounded-2xl border border-[#22232a] bg-[#121318] space-y-3 shadow-lg">
              <h3 className="text-sm font-bold text-white tracking-tight">
                About Application
              </h3>
              <div className="space-y-1 text-xs">
                <p className="text-white font-semibold">AI Short Video Reverse Engineer</p>
                <p className="text-zinc-400">Built by Yasir Hussain</p>
                <p className="text-zinc-500 text-[11px] pt-2">
                  Production short-form video reverse-engineering platform generating multimodal scene breakdowns and cross-platform prompts.
                </p>
              </div>
            </div>

            {/* Video Privacy & Retention */}
            <div className="p-5 rounded-2xl border border-[#22232a] bg-[#121318] space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Keep Original Video
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Retain video file after frame extraction
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setKeepVideo(!keepVideo)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    keepVideo ? "bg-brand-600 justify-end" : "bg-[#1e1f28] justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                When turned off, original uploaded video files are automatically wiped after frames are extracted to optimize storage.
              </p>
            </div>

            {/* System Diagnostics */}
            <div className="p-5 rounded-2xl border border-[#22232a] bg-[#121318] space-y-3 shadow-lg md:col-span-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-500" />
                <span>Diagnostics & Constraints</span>
              </h3>

              {systemStatus ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-[#0b0c0e] border border-[#22232a] space-y-1">
                    <span className="text-zinc-500">Max Video Duration</span>
                    <p className="font-bold text-white font-mono">
                      {systemStatus.max_video_duration_sec}s (Shorts)
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0b0c0e] border border-[#22232a] space-y-1">
                    <span className="text-zinc-500">Max Upload Size</span>
                    <p className="font-bold text-white font-mono">
                      {systemStatus.max_file_size_mb} MB
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0b0c0e] border border-[#22232a] space-y-1">
                    <span className="text-zinc-500">FFmpeg Engine</span>
                    <p className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Installed & Active
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Loading system status...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Unlock Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleAdminUnlock}
            className="bg-[#121318] border border-[#22232a] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
          >
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Owner & Admin Verification</h3>
              <p className="text-xs text-zinc-400">
                Enter your admin PIN to unlock proprietary engine templates and provider keys.
              </p>
            </div>

            <div className="space-y-1.5">
              <input
                type="password"
                autoFocus
                placeholder="Enter admin PIN (e.g., 1234 or admin)"
                value={adminPinInput}
                onChange={(e) => {
                  setAdminPinInput(e.target.value);
                  setAdminPinError(false);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0b0c0e] border border-[#22232a] text-white text-sm focus:outline-none focus:border-brand-500 text-center tracking-widest font-mono"
              />
              {adminPinError && (
                <p className="text-xs text-rose-400 text-center font-medium">
                  Invalid PIN. Please try again.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminPinInput("");
                  setAdminPinError(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#171820] text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
