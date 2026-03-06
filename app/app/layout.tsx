"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { NavSidebar } from "@/components/shared/nav-sidebar";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <NavSidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />

      <header className="border-b bg-white">
        <div className="flex h-12 items-center px-4 gap-3">
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
            onClick={() => setNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-base font-bold text-[#1F3864]">Routrize</span>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
