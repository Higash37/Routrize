"use client";

import { cn } from "@/lib/utils";
import type { RouteItemState } from "@/types/route-builder";
import { getSubTaskSize } from "@/types/route-builder";
import type { SubTaskSize } from "@/types/route-builder";
import { dateToPercent, getTotalDays, shortDate } from "@/lib/date-utils";
import { GanttBar, textColorFor } from "./gantt-bar";

/** メイン行の高さ */
export const MAIN_ROW_H = 90;
/** サブタスク1行の高さ */
export const SUB_ROW_H = 30;

/** アイテムの表示高さを計算（教科列のrowspan計算用） */
export function getRowHeight(item: RouteItemState, months: number): number {
  const visibleSubs = item.subtasks.filter(
    (sub) => months <= SIZE_MAX_MONTHS[getSubTaskSize(sub.startDate, sub.endDate)],
  );
  return MAIN_ROW_H + visibleSubs.length * SUB_ROW_H;
}

/** サイズごとの表示閾値（この月数以下で表示） */
const SIZE_MAX_MONTHS: Record<SubTaskSize, number> = {
  sm: 3,
  md: 6,
  lg: Infinity,
};

const SIZE_LABEL: Record<SubTaskSize, string> = {
  sm: "小",
  md: "中",
  lg: "大",
};

const SIZE_COLOR: Record<SubTaskSize, string> = {
  sm: "bg-sky-100 text-sky-700 border-sky-300",
  md: "bg-amber-100 text-amber-700 border-amber-300",
  lg: "bg-rose-100 text-rose-700 border-rose-300",
};

type GanttRowProps = {
  item: RouteItemState;
  routeStart: Date;
  routeEnd: Date;
  monthBorders: number[];
  months: number;
  isSelected: boolean;
  onSelect: () => void;
};

export function GanttRow({
  item,
  routeStart,
  routeEnd,
  monthBorders,
  months,
  isSelected,
  onSelect,
}: GanttRowProps) {
  const totalDays = getTotalDays(routeStart, routeEnd);
  const leftPercent = dateToPercent(item.startDate, routeStart, totalDays);
  const rightPercent = dateToPercent(item.endDate, routeStart, totalDays);
  const widthPercent = rightPercent - leftPercent;

  const visibleSubs = item.subtasks.filter(
    (sub) => months <= SIZE_MAX_MONTHS[getSubTaskSize(sub.startDate, sub.endDate)],
  );
  const totalHeight = MAIN_ROW_H + visibleSubs.length * SUB_ROW_H;

  return (
    <div
      className={cn(
        "relative border-b border-border/30 transition-colors cursor-pointer",
        isSelected ? "bg-blue-50" : "hover:bg-slate-50",
      )}
      style={{ height: `${totalHeight}px` }}
      onClick={onSelect}
    >
      {/* 月境界線 */}
      {monthBorders.map((pct, i) => (
        <div
          key={i}
          className="absolute top-0 h-full border-r border-border/20"
          style={{ left: `${pct}%` }}
        />
      ))}

      {/* メインバー */}
      <div className="relative" style={{ height: `${MAIN_ROW_H}px` }}>
        <GanttBar
          title={item.title}
          subject={item.subject}
          fields={item.fields}
          color={item.color}
          difficulty={item.difficulty}
          importance={item.importance}
          memo={item.memo}
          totalPages={item.totalPages}
          targetRounds={item.targetRounds}
          coverImageUrl={item.coverImageUrl}
          startDate={item.startDate}
          endDate={item.endDate}
          leftPercent={leftPercent}
          widthPercent={widthPercent}
          isSelected={isSelected}
        />
      </div>

      {/* サブタスクバー（メインと同じ矢印型・同色、小サイズ） */}
      {visibleSubs.map((sub) => {
        const subLeft = dateToPercent(sub.startDate, routeStart, totalDays);
        const subRight = dateToPercent(sub.endDate, routeStart, totalDays);
        const subWidth = subRight - subLeft;
        const sz = getSubTaskSize(sub.startDate, sub.endDate);
        const txtColor = textColorFor(item.color);

        return (
          <div key={sub.id} className="relative" style={{ height: `${SUB_ROW_H}px` }}>
            <div
              className="absolute top-1 h-5 flex items-center overflow-hidden"
              style={{
                left: `${subLeft}%`,
                width: `${subWidth}%`,
                minWidth: "36px",
                backgroundColor: item.color,
                clipPath: "polygon(5px 0, calc(100% - 5px) 0, 100% 50%, calc(100% - 5px) 100%, 5px 100%, 0 50%)",
              }}
            >
              {/* サイズバッジ */}
              <span
                className={cn(
                  "ml-1.5 inline-flex h-3 shrink-0 items-center rounded px-0.5 text-[7px] font-bold leading-none",
                  SIZE_COLOR[sz],
                )}
              >
                {SIZE_LABEL[sz]}
              </span>
              <span
                className="truncate px-1.5 text-[10px] font-medium leading-none"
                style={{ color: txtColor }}
              >
                {sub.label || "未設定"}
                <span style={{ color: txtColor, opacity: 0.6 }} className="ml-1">
                  {shortDate(sub.startDate)}〜{shortDate(sub.endDate)}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
