"use client";

import { useEffect, useState } from "react";
import { Plus, Calendar, BookOpen, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useOrgContext } from "@/hooks/use-org-context";
import { useAuth } from "@/hooks/use-auth";

type RouteSummary = {
  dbId: string;
  title: string;
  startDate: string;
  months: number;
  items: unknown[];
  ownerUserId: string;
  ownerEmail: string;
  updatedAt: string;
};

export default function RoutesPage() {
  const { storeId, isLoaded: orgLoaded } = useOrgContext();
  const { userId } = useAuth();
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!orgLoaded) return;
    if (!storeId) {
      setLoaded(true);
      return;
    }

    fetch(`/api/routes?storeId=${storeId}`)
      .then((res) => res.json())
      .then((data) => {
        setRoutes(data.routes ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [orgLoaded, storeId]);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="h-9 w-24 rounded bg-slate-200 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
            <div className="mt-3 h-4 w-64 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

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

      {routes.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {routes.map((route) => {
            const isMine = route.ownerUserId === userId;
            const itemCount = Array.isArray(route.items) ? route.items.length : 0;
            const updatedDate = new Date(route.updatedAt).toLocaleDateString("ja-JP", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Link
                key={route.dbId}
                href={`/?routeId=${route.dbId}`}
                className="block rounded-lg border bg-white p-4 shadow-sm hover:border-[#4472C4] hover:shadow transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1F3864]">{route.title}</h3>
                  {isMine && (
                    <span className="shrink-0 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                      自分
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {route.startDate.slice(0, 7)} 〜 {route.months}ヶ月
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    教材 {itemCount}冊
                  </span>
                  {route.ownerEmail && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {route.ownerEmail}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {updatedDate}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
