"use client";

import React, { useEffect, useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  Cpu,
  AlertCircle,
  Trash2,
  Loader2,
  Activity,
  Lock,
} from "lucide-react";
import {
  fetchProviders,
  saveProviderKey,
  deleteProviderKey,
  testProviderConnection,
} from "@/lib/api";
import { ProviderInfo } from "@/types";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Form states per provider
  const [inputKeys, setInputKeys] = useState<{ [key: string]: string }>({});
  const [selectedModels, setSelectedModels] = useState<{ [key: string]: string }>({});
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});

  // Action status states per provider
  const [savingStatus, setSavingStatus] = useState<{ [key: string]: boolean }>({});
  const [testingStatus, setTestingStatus] = useState<{ [key: string]: boolean }>({});
  const [feedback, setFeedback] = useState<{
    [key: string]: { type: "success" | "error"; message: string } | null;
  }>({});

  const loadProviders = async () => {
    try {
      setLoading(true);
      setPageError(null);
      const data = await fetchProviders();
      setProviders(data);

      // Initialize selected models
      const modelsMap: { [key: string]: string } = {};
      data.forEach((p) => {
        modelsMap[p.provider] = p.selected_model || p.available_models[0];
      });
      setSelectedModels(modelsMap);
    } catch (err: any) {
      setPageError(err.message || "Failed to load provider configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleKeyChange = (providerId: string, val: string) => {
    setInputKeys((prev) => ({ ...prev, [providerId]: val }));
    // Clear feedback when typing
    if (feedback[providerId]) {
      setFeedback((prev) => ({ ...prev, [providerId]: null }));
    }
  };

  const handleModelChange = (providerId: string, model: string) => {
    setSelectedModels((prev) => ({ ...prev, [providerId]: model }));
  };

  const toggleVisibility = (providerId: string) => {
    setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleSave = async (providerId: string) => {
    try {
      setSavingStatus((prev) => ({ ...prev, [providerId]: true }));
      setFeedback((prev) => ({ ...prev, [providerId]: null }));

      const keyVal = inputKeys[providerId];
      const modelVal = selectedModels[providerId];

      const updated = await saveProviderKey(providerId, {
        api_key: keyVal || undefined,
        selected_model: modelVal,
      });

      // Update provider in local list
      setProviders((prev) =>
        prev.map((p) => (p.provider === providerId ? updated : p))
      );

      // Clear input field if key was set
      if (keyVal) {
        setInputKeys((prev) => ({ ...prev, [providerId]: "" }));
      }

      setFeedback((prev) => ({
        ...prev,
        [providerId]: {
          type: "success",
          message: "API Key & Model saved securely.",
        },
      }));
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [providerId]: {
          type: "error",
          message: err.message || "Failed to save key.",
        },
      }));
    } finally {
      setSavingStatus((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleDelete = async (providerId: string) => {
    if (!confirm(`Are you sure you want to remove the stored API key for ${providerId}?`)) {
      return;
    }

    try {
      setSavingStatus((prev) => ({ ...prev, [providerId]: true }));
      await deleteProviderKey(providerId);

      // Refresh providers
      await loadProviders();

      setFeedback((prev) => ({
        ...prev,
        [providerId]: {
          type: "success",
          message: "API Key removed from database.",
        },
      }));
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [providerId]: {
          type: "error",
          message: err.message || "Failed to remove key.",
        },
      }));
    } finally {
      setSavingStatus((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleTestConnection = async (providerId: string) => {
    try {
      setTestingStatus((prev) => ({ ...prev, [providerId]: true }));
      setFeedback((prev) => ({ ...prev, [providerId]: null }));

      const keyVal = inputKeys[providerId];
      const modelVal = selectedModels[providerId];

      const res = await testProviderConnection(providerId, {
        api_key: keyVal || undefined,
        selected_model: modelVal,
      });

      if (res.success) {
        setFeedback((prev) => ({
          ...prev,
          [providerId]: {
            type: "success",
            message: res.message || `Connection to ${res.model} verified!`,
          },
        }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [providerId]: {
            type: "error",
            message: res.message || "Connection test failed.",
          },
        }));
      }
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [providerId]: {
          type: "error",
          message: err.message || "Network error while testing connection.",
        },
      }));
    } finally {
      setTestingStatus((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-brand-400" />
            AI Providers & BYOK
          </h1>
          <p className="text-sm text-slate-400">
            Bring Your Own Keys for Gemini, OpenAI, and Anthropic Claude.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-300 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-xl w-fit">
          <Lock className="w-4 h-4 text-brand-400" />
          <span>Server AES-256 Encrypted</span>
        </div>
      </div>

      {/* Security Note Banner */}
      <div className="p-4 rounded-xl bg-surface-900/40 border border-surface-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-slate-300">
          <p className="font-medium text-white">Zero API Markup & Complete Privacy</p>
          <p className="text-slate-400">
            Keys are encrypted at rest using server-side AES-256 and never logged or exposed in client bundles.
            For dev/offline testing, keys starting with <code className="text-brand-300 bg-surface-950 px-1 py-0.5 rounded">mock-</code> run in safe simulation mode without making external requests.
          </p>
        </div>
      </div>

      {/* Main Error */}
      {pageError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{pageError}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 animate-pulse h-48"
            />
          ))}
        </div>
      ) : (
        /* Provider Cards */
        <div className="grid grid-cols-1 gap-5">
          {providers.map((p) => {
            const isShow = showKeys[p.provider];
            const keyInput = inputKeys[p.provider] || "";
            const currentModel = selectedModels[p.provider] || p.selected_model;
            const isSaving = savingStatus[p.provider];
            const isTesting = testingStatus[p.provider];
            const statusMsg = feedback[p.provider];

            return (
              <div
                key={p.provider}
                className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-5 transition-all hover:border-surface-700"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-surface-800 text-brand-400 flex items-center justify-center border border-surface-700">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{p.name}</h3>
                        {p.has_key ? (
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Key Active
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 bg-surface-800 border border-surface-700 px-2 py-0.5 rounded-full">
                            Not Configured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                    </div>
                  </div>

                  {/* Masked Key Pill if stored */}
                  {p.has_key && p.masked_key && (
                    <div className="flex items-center gap-2 bg-surface-950 px-3 py-1.5 rounded-xl border border-surface-800 text-xs font-mono text-slate-300 w-fit">
                      <span className="text-slate-500 text-[10px] uppercase font-sans">Active:</span>
                      <span>{p.masked_key}</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.provider)}
                        title="Delete key"
                        className="text-slate-500 hover:text-red-400 transition-colors ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Form Fields: API Key & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {p.has_key ? "Replace API Key (Optional)" : "Enter API Key"}
                    </label>
                    <div className="relative">
                      <input
                        type={isShow ? "text" : "password"}
                        value={keyInput}
                        onChange={(e) => handleKeyChange(p.provider, e.target.value)}
                        placeholder={
                          p.has_key
                            ? "Enter new key to replace existing..."
                            : `Enter ${p.name} API key...`
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-surface-800 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm font-mono pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(p.provider)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {isShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Active Model
                    </label>
                    <select
                      value={currentModel}
                      onChange={(e) => handleModelChange(p.provider, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-surface-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                    >
                      {p.available_models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Feedback Message */}
                {statusMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      statusMsg.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : "bg-red-500/10 border border-red-500/20 text-red-300"
                    }`}
                  >
                    {statusMsg.type === "success" ? (
                      <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    )}
                    <span>{statusMsg.message}</span>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-surface-800/80">
                  <span className="text-xs text-slate-500">
                    Supports vision & multimodal extraction workflows.
                  </span>

                  <div className="flex items-center gap-2.5">
                    {/* Test Connection Button */}
                    <button
                      type="button"
                      onClick={() => handleTestConnection(p.provider)}
                      disabled={isTesting || (!p.has_key && !keyInput)}
                      className="px-3.5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isTesting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-brand-400" />
                      )}
                      <span>Test Connection</span>
                    </button>

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={() => handleSave(p.provider)}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-brand-500/20"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save Config</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
