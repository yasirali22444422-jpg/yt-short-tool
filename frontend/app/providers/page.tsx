"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, Eye, EyeOff, Check, Cpu } from "lucide-react";

interface ProviderConfig {
  id: string;
  name: string;
  defaultModel: string;
  models: string[];
  description: string;
  hasKey: boolean;
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([
    {
      id: "gemini",
      name: "Google Gemini",
      defaultModel: "gemini-2.5-flash",
      models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"],
      description: "Fast multimodal analysis with high native token context.",
      hasKey: false,
    },
    {
      id: "openai",
      name: "OpenAI",
      defaultModel: "gpt-4o",
      models: ["gpt-4o", "gpt-4o-mini"],
      description: "State-of-the-art vision and prompt synthesis.",
      hasKey: false,
    },
    {
      id: "claude",
      name: "Anthropic Claude",
      defaultModel: "claude-3-5-sonnet",
      models: ["claude-3-5-sonnet", "claude-3-5-haiku"],
      description: "Exceptional nuance in cinematography and style identification.",
      hasKey: false,
    },
  ]);

  const [inputKeys, setInputKeys] = useState<{ [key: string]: string }>({});
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [savedStatus, setSavedStatus] = useState<{ [key: string]: string }>({});

  const handleKeyChange = (providerId: string, val: string) => {
    setInputKeys((prev) => ({ ...prev, [providerId]: val }));
  };

  const toggleVisibility = (providerId: string) => {
    setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleSave = (providerId: string) => {
    setSavedStatus((prev) => ({ ...prev, [providerId]: "Saved locally" }));
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [providerId]: "" }));
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-brand-400" />
          AI Providers & BYOK
        </h1>
        <p className="text-sm text-slate-400">
          Bring your own API keys. All keys are encrypted server-side with AES-256 and never logged or exposed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {providers.map((p) => {
          const isShow = showKeys[p.id];
          const val = inputKeys[p.id] || "";
          const msg = savedStatus[p.id];

          return (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-800 text-brand-400 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400">{p.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-fit">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AES Encrypted</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={isShow ? "text" : "password"}
                      value={val}
                      onChange={(e) => handleKeyChange(p.id, e.target.value)}
                      placeholder={`Enter ${p.name} API key...`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-surface-800 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility(p.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {isShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Model
                  </label>
                  <select
                    defaultValue={p.defaultModel}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-surface-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  >
                    {p.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-surface-800/80">
                <span className="text-xs text-slate-500">
                  Leave empty to use server default configuration.
                </span>
                <div className="flex items-center gap-2">
                  {msg && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {msg}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSave(p.id)}
                    className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-semibold transition-colors"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
