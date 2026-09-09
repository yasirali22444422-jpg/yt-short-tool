"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Camera,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  X,
  Save,
  Clock,
  Compass,
  Film,
  Zap,
} from "lucide-react";
import { FullAnalysisPackage, SceneAnalysisData } from "@/types";
import { regenerateScenePrompts, updateSceneAnalysis } from "@/lib/api";

interface Props {
  analysis: FullAnalysisPackage;
  projectId: string;
  apiBase: string;
  onRefresh: () => void;
}

export default function AnalysisStudioView({ analysis, projectId, apiBase, onRefresh }: Props) {
  const [scenes, setScenes] = useState<SceneAnalysisData[]>(analysis.scenes || []);
  const [activePromptTab, setActivePromptTab] = useState<{ [sceneNum: number]: "image" | "i2v" | "t2v" | "negative" }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [regeneratingScene, setRegeneratingScene] = useState<number | null>(null);

  // Edit drawer state
  const [editingScene, setEditingScene] = useState<SceneAnalysisData | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SceneAnalysisData>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const getPromptTab = (sceneNum: number) => activePromptTab[sceneNum] || "image";

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegenerate = async (sceneNum: number) => {
    try {
      setRegeneratingScene(sceneNum);
      const updated = await regenerateScenePrompts(projectId, sceneNum);
      setScenes((prev) => prev.map((s) => (s.scene_number === sceneNum ? updated : s)));
      onRefresh();
    } catch (err: any) {
      alert(err.message || `Failed to regenerate Scene ${sceneNum}`);
    } finally {
      setRegeneratingScene(null);
    }
  };

  const handleOpenEdit = (scene: SceneAnalysisData) => {
    setEditingScene(scene);
    setEditFormData({
      scene_summary: scene.scene_summary,
      camera_shot: scene.camera_shot,
      camera_angle: scene.camera_angle,
      camera_movement: scene.camera_movement,
      lens_feel: scene.lens_feel,
      lighting: scene.lighting,
      image_prompt: scene.image_prompt,
      animation_prompt: scene.animation_prompt,
      text_to_video_prompt: scene.text_to_video_prompt,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingScene) return;
    try {
      setSavingEdit(true);
      const updated = await updateSceneAnalysis(projectId, editingScene.scene_number, editFormData);
      setScenes((prev) => prev.map((s) => (s.scene_number === editingScene.scene_number ? updated : s)));
      setEditingScene(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to save edits");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="p-4 rounded-2xl bg-surface-900/60 border border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-white">Scene DNA & Prompt Studio</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-grade image prompts, I2V animation directions, and full text-to-video blueprints.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-surface-950 border border-surface-800 text-slate-300 font-mono">
            Provider: <strong className="text-brand-400 capitalize">{analysis.provider}</strong> ({analysis.model})
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
            {scenes.length} Scenes Ready
          </span>
        </div>
      </div>

      {/* Scene Cards List */}
      <div className="space-y-6">
        {scenes.map((scene) => {
          const tab = getPromptTab(scene.scene_number);
          const isRegen = regeneratingScene === scene.scene_number;

          let promptText = scene.image_prompt;
          if (tab === "i2v") promptText = scene.animation_prompt;
          if (tab === "t2v") promptText = scene.text_to_video_prompt;
          if (tab === "negative") promptText = scene.negative_prompt;

          return (
            <div
              key={scene.scene_id}
              className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-5 transition-all hover:border-surface-700"
            >
              {/* Scene Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-xl bg-brand-600/20 text-brand-400 font-bold text-xs border border-brand-500/30">
                    SCENE {scene.scene_number.toString().padStart(2, "0")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {scene.start_time.toFixed(2)}s → {scene.end_time.toFixed(2)}s ({scene.duration.toFixed(1)}s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(scene)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-800 bg-surface-950 hover:bg-surface-800 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Edit Scene</span>
                  </button>

                  <button
                    onClick={() => handleRegenerate(scene.scene_number)}
                    disabled={isRegen}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-800 bg-surface-950 hover:bg-surface-800 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRegen ? "animate-spin" : ""}`} />
                    <span>{isRegen ? "Regenerating..." : "Regenerate"}</span>
                  </button>
                </div>
              </div>

              {/* Keyframe Images Strip (if any) */}
              {scene.keyframe_urls && scene.keyframe_urls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {scene.keyframe_urls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-surface-800 bg-surface-950 aspect-[9/16] group"
                    >
                      <img
                        src={`${apiBase.replace("/api", "")}${url}`}
                        alt={`Scene ${scene.scene_number} keyframe ${idx}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono">
                        Frame {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cinematography & Director Facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-brand-400" /> Shot Size
                  </span>
                  <p className="font-semibold text-white">{scene.camera_shot}</p>
                </div>

                <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-indigo-400" /> Angle & Lens
                  </span>
                  <p className="font-semibold text-white">
                    {scene.camera_angle} • <span className="text-slate-400">{scene.lens_feel}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Film className="w-3 h-3 text-emerald-400" /> Camera Move
                  </span>
                  <p className="font-semibold text-white truncate" title={scene.camera_movement}>
                    {scene.camera_movement}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Lighting
                  </span>
                  <p className="font-semibold text-white truncate" title={scene.lighting}>
                    {scene.lighting}
                  </p>
                </div>
              </div>

              {/* Action Description */}
              <div className="p-3.5 rounded-xl bg-surface-950/60 border border-surface-800/60 text-xs text-slate-300">
                <strong className="text-white">Director Action: </strong>
                {scene.character_actions.join("; ") || scene.scene_summary}
              </div>

              {/* Prompt Engine Studio Tabs */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-surface-950 p-1 rounded-xl border border-surface-800">
                    {[
                      { id: "image", label: "Image (Keyframe)" },
                      { id: "i2v", label: "Animation (I2V)" },
                      { id: "t2v", label: "Text-to-Video (T2V)" },
                      { id: "negative", label: "Negative Prompt" },
                    ].map((tabItem) => (
                      <button
                        key={tabItem.id}
                        onClick={() =>
                          setActivePromptTab((prev) => ({
                            ...prev,
                            [scene.scene_number]: tabItem.id as any,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          tab === tabItem.id
                            ? "bg-brand-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {tabItem.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCopy(promptText, `scene_${scene.scene_number}_${tab}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    {copiedKey === `scene_${scene.scene_number}_${tab}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Prompt Box */}
                <div className="relative p-4 rounded-xl bg-surface-950 border border-surface-800 font-mono text-xs text-slate-200 leading-relaxed break-words select-all">
                  {promptText}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-Line Scene Edit Modal */}
      {editingScene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-900 border border-surface-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-400" />
                Edit Scene {editingScene.scene_number.toString().padStart(2, "0")}
              </h3>
              <button
                onClick={() => setEditingScene(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold uppercase tracking-wider">
                  Scene Summary / Action
                </label>
                <textarea
                  value={editFormData.scene_summary || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, scene_summary: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold uppercase tracking-wider">Shot Size</label>
                  <input
                    type="text"
                    value={editFormData.camera_shot || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, camera_shot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold uppercase tracking-wider">Camera Angle</label>
                  <input
                    type="text"
                    value={editFormData.camera_angle || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, camera_angle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold uppercase tracking-wider">Camera Movement</label>
                  <input
                    type="text"
                    value={editFormData.camera_movement || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, camera_movement: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold uppercase tracking-wider">
                  Custom Image Prompt Override (Optional)
                </label>
                <textarea
                  value={editFormData.image_prompt || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, image_prompt: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 text-white font-mono text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-800">
              <button
                onClick={() => setEditingScene(null)}
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
