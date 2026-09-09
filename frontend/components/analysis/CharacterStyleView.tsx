"use client";

import React from "react";
import {
  Users,
  Box,
  MapPin,
  Palette,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { FullAnalysisPackage } from "@/types";

interface Props {
  analysis: FullAnalysisPackage;
}

export default function CharacterStyleView({ analysis }: Props) {
  const { characters, objects, locations, global_style, editing_dna } = analysis;

  return (
    <div className="space-y-8">
      {/* Global Style DNA Card */}
      <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-5">
        <div className="flex items-center justify-between border-b border-surface-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Global Style DNA</h2>
              <p className="text-xs text-slate-400">
                Visual aesthetics, lighting architecture, and cinematographic rules.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
            {global_style.medium}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Visual Aesthetic</span>
            <p className="font-semibold text-white">{global_style.visual_style}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Color Palette</span>
            <p className="font-semibold text-white">{global_style.color_palette}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Lighting Architecture</span>
            <p className="font-semibold text-white">{global_style.lighting_style}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Camera Language</span>
            <p className="font-semibold text-white">{global_style.camera_language}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Texture & Depth</span>
            <p className="font-semibold text-white">
              {global_style.texture_style} • {global_style.depth_of_field}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Editing Cadence</span>
            <p className="font-semibold text-white">
              {editing_dna.editing_pace} (~{editing_dna.average_shot_length}s/shot)
            </p>
          </div>
        </div>
      </div>

      {/* Character Bibles Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Character Bibles & Continuity Registry</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {characters.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-surface-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                    {c.id.replace("CHAR_", "C")}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{c.display_name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">{c.id}</span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {Math.round(c.confidence * 100)}% Consistency Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-950/60 border border-surface-800/60">
                  <span className="text-[10px] uppercase text-slate-400 block">Type / Age</span>
                  <span className="text-white font-medium capitalize">
                    {c.type} • {c.estimated_age}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-950/60 border border-surface-800/60">
                  <span className="text-[10px] uppercase text-slate-400 block">Build & Skin</span>
                  <span className="text-white font-medium capitalize">
                    {c.height_build} • {c.skin_tone}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-950/60 border border-surface-800/60 col-span-2">
                  <span className="text-[10px] uppercase text-slate-400 block">Hair & Facial</span>
                  <span className="text-white font-medium">
                    {c.hair}, {c.eyes} eyes, {c.face_shape} shape
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-950/60 border border-surface-800/60 col-span-2">
                  <span className="text-[10px] uppercase text-slate-400 block">Wardrobe / Clothing</span>
                  <span className="text-white font-medium">
                    {c.clothing.join(", ") || "Standard attire"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Objects & Locations Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recurring Objects */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Recurring Objects & Props</h3>
          </div>

          <div className="space-y-3">
            {objects.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-xl bg-surface-900/60 border border-surface-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">{o.name}</h4>
                  <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {o.id}
                  </span>
                </div>
                <p className="text-slate-300">{o.appearance}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Color: {o.color}</span>
                  <span>•</span>
                  <span>Material: {o.material}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Registry */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Location Registry</h3>
          </div>

          <div className="space-y-3">
            {locations.map((l) => (
              <div
                key={l.id}
                className="p-4 rounded-xl bg-surface-900/60 border border-surface-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">{l.name}</h4>
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {l.id}
                  </span>
                </div>
                <p className="text-slate-300">
                  {l.environment} • Time: {l.time_of_day} • Lighting: {l.lighting}
                </p>
                <div className="text-[10px] text-slate-400">
                  Architecture: {l.architecture} • Palette: {l.color_palette}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
