"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderGit2,
  PlusCircle,
  Settings,
  Menu,
  X,
  Clapperboard,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      href: "/projects",
      label: "My Projects",
      icon: FolderGit2,
      isActive: pathname === "/" || pathname === "/projects" || (pathname.startsWith("/projects/") && !pathname.includes("/new")),
    },
    {
      href: "/new",
      label: "New Project",
      icon: PlusCircle,
      isActive: pathname === "/new",
    },
  ];

  const settingsActive = pathname.startsWith("/settings");

  const NavContent = () => (
    <div className="flex flex-col h-full justify-between p-4 bg-[#0e0f13] border-r border-[#1f2026]">
      {/* Top Section: Brand & Main Nav */}
      <div className="space-y-6">
        {/* Brand Header */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-2 py-1.5 group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-[#17181e] border border-[#2b2c34] flex items-center justify-center text-white shadow-inner group-hover:border-brand-500/60 transition-colors">
            <div className="absolute inset-0 rounded-xl bg-brand-500/10 blur-sm pointer-events-none" />
            <Clapperboard className="w-4 h-4 text-brand-500 relative z-10" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-brand-400 transition-colors">
              AI Short Video Reverse Engineer
            </h1>
            <p className="text-[11px] text-zinc-500 font-medium">
              Built by Yasir Hussain
            </p>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  item.isActive
                    ? "bg-[#181920] text-white border border-[#2c2d36] shadow-sm text-brand-400"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#14151a]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    item.isActive ? "text-brand-500" : "text-zinc-400"
                  }`}
                />
                <span>{item.label}</span>
                {item.isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_6px_#f97316]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Settings */}
      <div className="pt-4 border-t border-[#1f2026]">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            settingsActive
              ? "bg-[#181920] text-white border border-[#2c2d36] shadow-sm text-brand-400"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#14151a]"
          }`}
        >
          <Settings
            className={`w-4 h-4 ${
              settingsActive ? "text-brand-500" : "text-zinc-400"
            }`}
          />
          <span>Settings</span>
          {settingsActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_6px_#f97316]" />
          )}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-64 z-40">
        <NavContent />
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0e0f13] border-b border-[#1f2026]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#17181e] border border-[#2b2c34] flex items-center justify-center text-brand-500">
            <Clapperboard className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              AI Short Video Reverse Engineer
            </span>
            <span className="text-[10px] text-zinc-500 block">
              Built by Yasir Hussain
            </span>
          </div>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white bg-[#17181e] border border-[#2b2c34]"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}
