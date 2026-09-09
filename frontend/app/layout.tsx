import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "AI Short Video Reverse Engineer — Built by Yasir Hussain",
  description:
    "Deconstruct reference short videos into detailed cinematography blueprints, scene breakdowns, character bibles, and generation-ready prompts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="bg-[#0b0c0e] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-brand-500/20 selection:text-brand-300"
        suppressHydrationWarning
      >
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
            <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </div>
            <footer className="border-t border-[#1a1b22] py-4 text-center text-xs text-zinc-600">
              AI Short Video Reverse Engineer • Built by Yasir Hussain
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
