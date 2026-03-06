"use client";

import { useMemo } from "react";
import type { RouteItemState } from "@/types/route-builder";
import {
  getMonthColumns,
  getRouteDateRange,
  getTotalDays,
  getWeekColumns,
} from "@/lib/date-utils";
import { GanttRow } from "./gantt-row";
import { BookOpen } from "lucide-react";

type RouteGanttProps = {
  items: RouteItemState[];
  startDate: string;
  months: number;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
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

export function RouteGantt({
  items,
  startDate,
  months,
  selectedItemId,
  onSelectItem,
}: RouteGanttProps) {
  const { monthCols, yearGroups, weekCols, routeStart, routeEnd, monthBorders } =
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
      };
    }, [startDate, months]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden" data-print-gantt>
      {/* 年 + 月 + 週 ヘッダー */}
      <div className="sticky top-0 z-10 shrink-0 border-b bg-[#1F3864]">
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

      {/* ガント行 */}
      <div className="flex-1 bg-white">
        {items.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center gap-3 text-muted-foreground">
            <BookOpen className="h-14 w-14 text-muted-foreground/30" />
            <p className="text-base">参考書を追加してルートを作成しましょう</p>
            <p className="text-sm text-muted-foreground/60">
              左の「+参考書追加」ボタンから教材を選択できます
            </p>
          </div>
        ) : (
          items.map((item) => (
            <GanttRow
              key={item.id}
              item={item}
              routeStart={routeStart}
              routeEnd={routeEnd}
              monthBorders={monthBorders}
              months={months}
              isSelected={item.id === selectedItemId}
              onSelect={() =>
                onSelectItem(item.id === selectedItemId ? null : item.id)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
