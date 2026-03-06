"use client";

import { cn } from "@/lib/utils";
import { X, LayoutGrid, BookMarked } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { href: "/", label: "カリキュラム作成", icon: LayoutGrid },
  { href: "/books", label: "教材登録", icon: BookMarked },
];

export function NavSidebar({ isOpen, onClose }: NavSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-56 flex-col bg-[#1F3864] shadow-xl transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* ヘッダー */}
        <div className="flex h-12 items-center justify-between border-b border-[#2B5797] px-4">
          <span className="text-sm font-bold text-white">Routrize</span>
          <button
            type="button"
            className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* フッター */}
        <div className="border-t border-[#2B5797] px-4 py-3">
          <p className="text-[10px] text-white/30">Routrize v0.1</p>
        </div>
      </div>
    </>
  );
}
