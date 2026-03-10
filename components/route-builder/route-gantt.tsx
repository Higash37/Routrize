"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { RouteItemState } from "@/types/route-builder";
import {
  dateToPercent,
  getMonthColumns,
  getRouteDateRange,
  getTotalDays,
  getWeekColumns,
} from "@/lib/date-utils";
import { textColorFor } from "./gantt-bar";
import { BookOpen } from "lucide-react";
import { DEFAULT_SUBJECT_PRESETS } from "@/lib/subject-presets";

type RouteGanttProps = {
  items: RouteItemState[];
  startDate: string;
  months: number;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onAddClick?: () => void;
};

type MonthCol = {
  year: number;
  month: number;
  widthPercent: number;
};

type YearGroup = {
  year: number;
  widthPercent: number;
};

type WeekCol = {
  week: number;
  leftPercent: number;
  widthPercent: number;
};

/** 1レーンの高さ（★ラベル + バー + 表紙画像分） */
const LANE_H = 80;
/** 表紙画像サイズ */
const IMG_W = 48;
const IMG_H = 68;
const IMG_GAP = 3;

function starsStr(count: number) {
  return "★".repeat(count) + "☆".repeat(5 - count);
}

/** 日程が被らないアイテムを同じレーンに詰める */
function allocateLanes(items: RouteItemState[]): { laneMap: Map<string, number>; laneCount: number } {
  const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const laneEnds: string[] = [];
  const laneMap = new Map<string, number>();

  for (const item of sorted) {
    let assigned = false;
    for (let lane = 0; lane < laneEnds.length; lane++) {
      if (item.startDate > laneEnds[lane]) {
        laneEnds[lane] = item.endDate;
        laneMap.set(item.id, lane);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      laneMap.set(item.id, laneEnds.length);
      laneEnds.push(item.endDate);
    }
  }

  return { laneMap, laneCount: Math.max(laneEnds.length, 1) };
}

export function RouteGantt({
  items,
  startDate,
  months,
  selectedItemId,
  onSelectItem,
  onAddClick,
}: RouteGanttProps) {
  const { monthCols, yearGroups, weekCols, routeStart, routeEnd, monthBorders, totalDays } =
    useMemo(() => {
      const cols = getMonthColumns(startDate, months);
      const { routeStart: rs, routeEnd: re } = getRouteDateRange(startDate, months);
      const td = getTotalDays(rs, re);

      const borders = cols.slice(1).map((col) => {
        const daysDiff =
          (col.start.getTime() - rs.getTime()) / (1000 * 60 * 60 * 24);
        return (daysDiff / td) * 100;
      });

      const mCols: MonthCol[] = cols.map((col) => {
        const colStart =
          (col.start.getTime() - rs.getTime()) / (1000 * 60 * 60 * 24);
        const colEnd =
          (col.end.getTime() - rs.getTime()) / (1000 * 60 * 60 * 24);
        return {
          year: col.year,
          month: col.month,
          widthPercent: ((colEnd - colStart + 1) / td) * 100,
        };
      });

      const yGroups: YearGroup[] = [];
      for (const mc of mCols) {
        const last = yGroups[yGroups.length - 1];
        if (last && last.year === mc.year) {
          last.widthPercent += mc.widthPercent;
        } else {
          yGroups.push({ year: mc.year, widthPercent: mc.widthPercent });
        }
      }

      const wCols: WeekCol[] = getWeekColumns(rs, re, td);

      return {
        monthCols: mCols,
        yearGroups: yGroups,
        weekCols: wCols,
        routeStart: rs,
        routeEnd: re,
        monthBorders: borders,
        totalDays: td,
      };
    }, [startDate, months]);

  // 教科ごとにグループ化し、プリセット順でソート
  const subjectGroups = useMemo(() => {
    const subjectOrder = new Map<string, number>();
    let idx = 0;
    for (const preset of DEFAULT_SUBJECT_PRESETS) {
      for (const s of preset.subjects) {
        if (!subjectOrder.has(s)) {
          subjectOrder.set(s, idx++);
        }
      }
    }

    const groups = new Map<string, RouteItemState[]>();
    for (const item of items) {
      const key = item.subject || "";
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }

    return [...groups.entries()]
      .sort(([a], [b]) => {
        const oa = subjectOrder.get(a) ?? 9999;
        const ob = subjectOrder.get(b) ?? 9999;
        return oa - ob;
      })
      .map(([subject, groupItems]) => ({ subject, items: groupItems }));
  }, [items]);

  /** 教科ラベル列の幅 */
  const LABEL_W = "w-14";

  return (
    <div className="flex flex-1 flex-col overflow-hidden" data-print-gantt>
      {/* 年 + 月 + 週 ヘッダー */}
      <div className="sticky top-0 z-10 shrink-0 border-b bg-[#1F3864]">
        <div className="flex">
          {/* 教科列ヘッダー */}
          <div className={`${LABEL_W} shrink-0 border-r border-[#2B5797] flex items-center justify-center`}>
            <span className="text-[9px] text-white/40">教科</span>
          </div>
          {/* ガントヘッダー */}
          <div className="flex-1 min-w-0">
            {/* 年行 */}
            <div className="flex h-8 border-b border-[#2B5797]">
              {yearGroups.map((yg) => (
                <div
                  key={yg.year}
                  className="flex items-center justify-center overflow-hidden border-r border-[#2B5797] text-sm font-semibold text-white"
                  style={{ width: `${yg.widthPercent}%` }}
                >
                  {yg.year}
                </div>
              ))}
            </div>
            {/* 月行 */}
            <div className="flex h-8 border-b border-[#2B5797]/60">
              {monthCols.map((col) => (
                <div
                  key={`${col.year}-${col.month}`}
                  className="flex items-center justify-center overflow-hidden border-r border-[#2B5797]/40 text-sm font-medium text-white/90"
                  style={{ width: `${col.widthPercent}%` }}
                >
                  {col.month}月
                </div>
              ))}
            </div>
            {/* 週行 */}
            <div className="relative flex h-6">
              {weekCols.map((wc) => (
                <div
                  key={wc.week}
                  className="absolute flex items-center justify-center overflow-hidden border-r border-[#2B5797]/20 text-xs text-white/50"
                  style={{
                    left: `${wc.leftPercent}%`,
                    width: `${wc.widthPercent}%`,
                  }}
                >
                  {wc.week}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ガント行 */}
      <div
        className="flex-1 bg-white"
        onClick={(e) => {
          if (e.target === e.currentTarget && onAddClick) onAddClick();
        }}
      >
        {items.length === 0 ? (
          <div
            className="flex h-60 flex-col items-center justify-center gap-3 text-muted-foreground cursor-pointer"
            onClick={() => onAddClick?.()}
          >
            <BookOpen className="h-14 w-14 text-muted-foreground/30" />
            <p className="text-base">クリックして教材を追加</p>
            <p className="text-sm text-muted-foreground/60">
              教材を選択してルートを作成しましょう
            </p>
          </div>
        ) : (
          subjectGroups.map((group) => {
            const { laneMap, laneCount } = allocateLanes(group.items);
            const groupHeight = laneCount * LANE_H;
            const accentColor = group.items[0]?.color || null;

            return (
              <div key={group.subject} className="flex border-b border-slate-200">
                {/* 教科ラベル */}
                <div
                  className={`${LABEL_W} shrink-0 border-r border-border/30 flex items-center justify-center bg-slate-50`}
                  style={{
                    height: `${groupHeight}px`,
                    borderLeftWidth: "3px",
                    borderLeftColor: accentColor ?? "transparent",
                  }}
                >
                  <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight px-1">
                    {group.subject || "未設定"}
                  </span>
                </div>
                {/* ガントエリア */}
                <div
                  className="relative flex-1 min-w-0 cursor-pointer"
                  style={{ height: `${groupHeight}px` }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget && onAddClick) onAddClick();
                  }}
                >
                  {/* 月境界線 */}
                  {monthBorders.map((pct, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full border-r border-border/20"
                      style={{ left: `${pct}%` }}
                    />
                  ))}
                  {/* バー（レーンにパッキング） */}
                  {group.items.map((item) => {
                    const lane = laneMap.get(item.id) ?? 0;
                    const leftPct = dateToPercent(item.startDate, routeStart, totalDays);
                    const rightPct = dateToPercent(item.endDate, routeStart, totalDays);
                    const widthPct = rightPct - leftPct;
                    const isSelected = item.id === selectedItemId;
                    const hasImage = !!item.coverImageUrl;
                    const labelLeft = hasImage ? `${IMG_W + IMG_GAP}px` : "2px";

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "absolute cursor-pointer transition-all",
                          isSelected ? "z-10 drop-shadow-md" : "hover:brightness-110",
                        )}
                        style={{
                          top: `${lane * LANE_H + 2}px`,
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          height: `${LANE_H - 4}px`,
                          minWidth: "48px",
                        }}
                        onClick={() =>
                          onSelectItem(item.id === selectedItemId ? null : item.id)
                        }
                      >
                        {/* ★ラベル（バーの上） */}
                        <div
                          className="absolute flex items-center gap-1.5 whitespace-nowrap"
                          style={{ left: labelLeft, bottom: "38px" }}
                        >
                          <span className="text-xs leading-none text-amber-500">
                            難{starsStr(item.difficulty)}
                          </span>
                          <span className="text-xs leading-none text-rose-400">
                            重{starsStr(item.importance)}
                          </span>
                        </div>

                        {/* 矢印バー（下端に配置） */}
                        <div
                          className={cn(
                            "absolute bottom-0 left-0 right-0 h-9",
                            isSelected && "ring-2 ring-blue-400 ring-offset-1 rounded-sm",
                          )}
                          style={{
                            backgroundColor: item.color,
                            clipPath:
                              "polygon(7px 0, calc(100% - 7px) 0, 100% 50%, calc(100% - 7px) 100%, 7px 100%, 0 50%)",
                          }}
                        >
                          <div
                            className="flex h-full items-center overflow-hidden"
                            style={{
                              paddingLeft: hasImage ? `${IMG_W + IMG_GAP + 6}px` : "16px",
                              paddingRight: "16px",
                            }}
                          >
                            <span
                              className="truncate text-xs font-medium leading-none"
                              style={{ color: textColorFor(item.color) }}
                            >
                              {item.title}
                            </span>
                          </div>
                        </div>

                        {/* 表紙画像（バー先頭に重ねて配置） */}
                        {hasImage && (
                          <img
                            src={item.coverImageUrl!}
                            alt=""
                            className="absolute left-0 bottom-0 rounded-sm border border-white/70 object-cover shadow-sm"
                            style={{ height: `${IMG_H}px`, width: `${IMG_W}px` }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
