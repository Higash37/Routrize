"use client";

import { memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  LayoutGrid,
  List,
  BookMarked,
  Tags,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { useAuth } from "@/hooks/use-auth";

type NavSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  wip?: boolean;
};

const GUEST_ITEMS: NavItem[] = [
  { href: "/", label: "カリキュラム作成", icon: LayoutGrid },
  { href: "/books", label: "教材登録", icon: BookMarked },
];

const AUTH_ITEMS: NavItem[] = [
  { href: "/", label: "カリキュラム作成", icon: LayoutGrid },
  { href: "/app/routes", label: "カリキュラム一覧", icon: List },
  { href: "/books", label: "教材登録", icon: BookMarked },
  { href: "/app/subjects", label: "教科タグ管理", icon: Tags },
  { href: "/app/dashboard", label: "ダッシュボード", icon: LayoutDashboard, wip: true },
  { href: "/app/students", label: "生徒管理", icon: Users, wip: true },
  { href: "/app/settings", label: "設定", icon: Settings },
];

export const NavSidebar = memo(function NavSidebar({ isOpen, onClose }: NavSidebarProps) {
  const pathname = usePathname();
  const { isLoggedIn, isLoading } = useAuth();
  const items = isLoading ? GUEST_ITEMS : isLoggedIn ? AUTH_ITEMS : GUEST_ITEMS;

  const handleLogout = useCallback(async () => {
    onClose();
    await logout();
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-56 flex-col bg-[#1F3864] shadow-xl transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex h-12 items-center justify-between border-b border-[#2B5797] px-4">
          <span className="text-sm font-bold text-white">Routrize</span>
          <button
            type="button"
            className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            onClick={onClose}
            tabIndex={isOpen ? 0 : -1}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                tabIndex={isOpen ? 0 : -1}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {item.wip && (
                  <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40">
                    開発中
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#2B5797] p-3">
          {isLoading ? null : isLoggedIn ? (
            <form action={handleLogout}>
              <button
                type="submit"
                tabIndex={isOpen ? 0 : -1}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                ログアウト
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              tabIndex={isOpen ? 0 : -1}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              ログイン
            </Link>
          )}
          <p className="mt-2 px-3 text-[10px] text-white/30">Routrize v0.1</p>
        </div>
      </div>
    </>
  );
});
