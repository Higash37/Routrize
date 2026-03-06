"use client";

import { useEffect, useState } from "react";
import { Plus, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { RouteState } from "@/types/route-builder";

const GUEST_ROUTE_KEY = "routrize:guest-route";

type RouteSummary = {
  title: string;
  startDate: string;
  months: number;
  itemCount: number;
};

function loadLocalRoute(): RouteSummary | null {
  try {
    const raw = localStorage.getItem(GUEST_ROUTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RouteState;
    if (!parsed.items || parsed.items.length === 0) return null;
    return {
      title: parsed.title,
      startDate: parsed.startDate,
      months: parsed.months,
      itemCount: parsed.items.length,
    };
  } catch {
    return null;
  }
}

export default function RoutesPage() {
  const [localRoute, setLocalRoute] = useState<RouteSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLocalRoute(loadLocalRoute());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">カリキュラム一覧</h1>
        <Button size="sm" className="gap-1.5 bg-[#1F3864] hover:bg-[#2B5797]" asChild>
          <Link href="/">
            <Plus className="h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      {/* TODO: DB保存実装後はSupabaseから取得したルートを一覧表示 */}

      {localRoute ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">ローカル保存（ログイン前に作成）</p>
          <Link
            href="/"
            className="block rounded-lg border bg-white p-4 shadow-sm hover:border-[#4472C4] hover:shadow transition-all"
          >
            <h3 className="font-semibold">{localRoute.title}</h3>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {localRoute.startDate.slice(0, 7)} 〜 {localRoute.months}ヶ月
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                教材 {localRoute.itemCount}冊
              </span>
            </div>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white py-16">
          <p className="text-muted-foreground">まだカリキュラムがありません</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5"
            asChild
          >
            <Link href="/">
              <Plus className="h-4 w-4" />
              カリキュラムを作成する
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
