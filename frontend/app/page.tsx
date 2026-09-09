import VideoUploader from "@/components/upload/VideoUploader";
import { Sparkles, Clapperboard, Compass, Bot } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <div className="text-center space-y-3 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Reference Video to AI Recreation Blueprint</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          AI Short Video Reverse Engineer
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Upload any 1–90s short, reel, or animation reference. Extract character bibles, camera motion, lighting style, and generation-ready prompts.
        </p>
      </div>

      {/* Main Upload Card */}
      <VideoUploader />

      {/* Workflow Features Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto pt-6 border-t border-surface-800/80">
        <div className="p-4 rounded-xl bg-surface-900/40 border border-surface-800/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Clapperboard className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-white">Shot-by-Shot DNA</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatic scene detection, shot sizing, camera moves, and lighting breakdowns for every scene.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-900/40 border border-surface-800/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-white">Character & Style Registry</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Persistent character IDs, facial consistency descriptions, and global aesthetic styling.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-900/40 border border-surface-800/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-white">Multi-Target Prompts</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Compiles image prompts, image-to-video animation directions, and full text-to-video blueprints.
          </p>
        </div>
      </div>
    </div>
  );
}
