"use client";

import type { RouteItemState } from "@/types/route-builder";
import { shortDate } from "@/lib/date-utils";
import { textColorFor } from "./gantt-bar";

type RouteDetailPageProps = {
  items: RouteItemState[];
  title: string;
};

function stars(count: number) {
  return "★".repeat(count) + "☆".repeat(5 - count);
}

/** 印刷裏面：教材ごとの詳細カード */
export function RouteDetailPage({ items, title }: RouteDetailPageProps) {
  if (items.length === 0) return null;

  return (
    <div className="hidden print:block break-before-page p-6">
      <h2 className="text-lg font-bold mb-4">{title} — 教材詳細</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border p-3 text-xs break-inside-avoid">
            {/* ヘッダー */}
            <div className="flex gap-3 mb-2">
              {item.coverImageUrl && (
                <img
                  src={item.coverImageUrl}
                  alt=""
                  className="h-16 w-12 rounded border object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {item.subject && (
                    <span
                      className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: item.color, color: textColorFor(item.color) }}
                    >
                      {item.subject}
                    </span>
                  )}
                  {item.targetGrade && (
                    <span className="text-[10px] text-slate-500">{item.targetGrade}</span>
                  )}
                </div>
                <p className="text-slate-500 mt-1">
                  {shortDate(item.startDate)} 〜 {shortDate(item.endDate)}
                </p>
              </div>
            </div>

            {/* 詳細 */}
            <div className="space-y-1 border-t pt-2">
              <div className="flex gap-3">
                <span className="text-amber-500">難{stars(item.difficulty)}</span>
                <span className="text-rose-400">重{stars(item.importance)}</span>
              </div>
              {item.targetRounds > 1 && (
                <p>
                  <span className="font-medium">目標:</span> {item.targetRounds}周
                  {item.totalPages > 0 && ` (${item.totalPages}p)`}
                </p>
              )}
              {item.memo && (
                <p>
                  <span className="font-medium">目的:</span> {item.memo}
                </p>
              )}
              {item.fields.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.fields.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
              {item.subtasks.length > 0 && (
                <div className="mt-1">
                  <p className="font-medium mb-0.5">タスク:</p>
                  {item.subtasks.map((sub, i) => (
                    <p key={sub.id} className="pl-2 text-[10px] text-slate-600">
                      #{i + 1} {sub.label || "未設定"} ({shortDate(sub.startDate)}〜
                      {shortDate(sub.endDate)})
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
