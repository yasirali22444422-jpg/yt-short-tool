import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "AI Short Video Reverse Engineer - Production Recreation Blueprints",
  description:
    "Deconstruct reference short videos into detailed cinematography blueprints, character bibles, style DNA, and multi-platform prompts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="bg-[#070b14] text-slate-100 min-h-screen flex flex-col antialiased"
        suppressHydrationWarning
      >
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-surface-800/60 py-6 text-center text-xs text-slate-500">
          AI Short Video Reverse Engineering Tool • Phase 1 Foundation
        </footer>
      </body>
    </html>
  );
}
