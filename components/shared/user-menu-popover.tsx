"use client";

import { useState } from "react";
import { UserCircle, Settings, LogOut, Building2, Store } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/app/login/actions";

export function UserMenuPopover() {
  const { email } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-full p-1 text-[#1F3864] hover:bg-slate-100 transition-colors"
        >
          <UserCircle className="h-6 w-6" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        {/* ユーザー情報 */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F3864] text-sm font-bold text-white">
              {email ? email[0].toUpperCase() : "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{email || "---"}</p>
            </div>
          </div>
        </div>

        {/* メニュー */}
        <div className="p-1.5">
          <MenuLink
            href="/app/settings"
            icon={Settings}
            label="設定"
            onClick={() => setOpen(false)}
          />
          <MenuButton
            icon={Building2}
            label="組織切替"
            badge="開発中"
            onClick={() => {}}
          />
          <MenuButton
            icon={Store}
            label="店舗切替"
            badge="開発中"
            onClick={() => {}}
          />
        </div>

        {/* ログアウト */}
        <div className="border-t p-1.5">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-slate-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof Settings;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-slate-100 transition-colors"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Link>
  );
}

function MenuButton({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: typeof Settings;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!badge}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-default disabled:hover:bg-transparent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
      {badge && (
        <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}
