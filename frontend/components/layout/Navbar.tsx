"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, FolderGit2, KeyRound, Settings, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchSystemStatus } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSystemStatus()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const navItems = [
    { href: "/", label: "New Analysis", icon: Film },
    { href: "/projects", label: "My Projects", icon: FolderGit2 },
    { href: "/providers", label: "AI Providers", icon: KeyRound },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="border-b border-surface-800 bg-surface-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white block">
              Short2Blueprint <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">V1</span>
            </span>
            <span className="text-xs text-slate-400 hidden sm:block">AI Short Video Reverse Engineer</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-surface-800 text-white shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-surface-900 border-surface-800">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : backendOnline === false
                  ? "bg-rose-500"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              {backendOnline === true
                ? "Backend Ready"
                : backendOnline === false
                ? "Backend Offline"
                : "Connecting..."}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
