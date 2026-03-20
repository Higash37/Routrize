"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { RouteItemState, RouteEvent, EventLane } from "@/types/route-builder";
import {
  dateToPercent,
  getMonthColumns,
  getRouteDateRange,
  getTotalDays,
  getWeekColumns,
  toISODate,
} from "@/lib/date-utils";
import { textColorFor } from "./gantt-bar";
import { BookOpen, Plus, X } from "lucide-react";
import { DEFAULT_SUBJECT_PRESETS } from "@/lib/subject-presets";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EVENT_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

type RouteGanttProps = {
  items: RouteItemState[];
  eventLanes: EventLane[];
  startDate: string;
  months: number;
  title: string;
  studentName: string;
  studentGrade: string;
  studentSchool: string;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onAddClick?: () => void;
  onAddEventLane?: (lane: EventLane) => void;
  onUpdateEventLane?: (laneId: string, label: string) => void;
  onRemoveEventLane?: (laneId: string) => void;
  onAddLaneEvent?: (laneId: string, event: RouteEvent) => void;
  onUpdateLaneEvent?: (laneId: string, eventId: string, changes: Partial<RouteEvent>) => void;
  onRemoveLaneEvent?: (laneId: string, eventId: string) => void;
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

/** 1レーンの高さ */
const LANE_H = 40;
/** 表紙画像サイズ */
const IMG_W = 24;
const IMG_H = 34;
const IMG_GAP = 2;

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
  eventLanes,
  startDate,
  months,
  title,
  studentName,
  studentGrade,
  studentSchool,
  selectedItemId,
  onSelectItem,
  onAddClick,
  onAddEventLane,
  onUpdateEventLane,
  onRemoveEventLane,
  onAddLaneEvent,
  onUpdateLaneEvent,
  onRemoveLaneEvent,
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
  const LABEL_W = "w-10";

  return (
    <div className="flex flex-1 flex-col overflow-hidden" data-print-gantt>
      {/* ヘッダー（情報行 + 年月週） */}
      <div className="sticky top-0 z-10 shrink-0 border-b bg-[#1F3864]">
        {/* 情報行 */}
        <div className="flex h-5 print:h-10 items-center bg-white border-b border-slate-200 px-1.5 print:px-3">
          <img src="/icon.png" alt="Routrize" className="h-3 w-3 print:h-6 print:w-6 shrink-0" />
          <span className="ml-1.5 print:ml-3 text-[9px] print:text-lg font-bold text-[#1F3864] truncate">{title}</span>
          <div className="ml-auto flex items-center gap-3 print:gap-8">
            {studentName && <span className="text-[8px] text-slate-600 shrink-0 print:hidden">名前：{studentName}</span>}
            {studentGrade && <span className="text-[8px] text-slate-600 shrink-0 print:hidden">学年：{studentGrade}</span>}
            {studentSchool && <span className="text-[8px] text-slate-600 shrink-0 print:hidden">学校：{studentSchool}</span>}
            <span className="hidden print:inline-flex flex-col shrink-0">
              <span className="text-base text-slate-600">名前：{studentName}</span>
              <span className="w-56" style={{ borderBottom: "1px solid #94a3b8" }} />
            </span>
            <span className="hidden print:inline-flex flex-col shrink-0">
              <span className="text-base text-slate-600">学年：{studentGrade}</span>
              <span className="w-32" style={{ borderBottom: "1px solid #94a3b8" }} />
            </span>
            <span className="hidden print:inline-flex flex-col shrink-0">
              <span className="text-base text-slate-600">学校：{studentSchool}</span>
              <span style={{ borderBottom: "1px solid #94a3b8", width: "10.5rem" }} />
            </span>
          </div>
        </div>
        <div className="flex">
          {/* 教科列ヘッダー */}
          <div className={`${LABEL_W} shrink-0 border-r border-[#2B5797] flex items-center justify-center`}>
            <img src="/icon-outline.svg" alt="Routrize" className="h-3.5 w-3.5" />
          </div>
          {/* ガントヘッダー */}
          <div className="flex-1 min-w-0">
            {/* 年行 */}
            <div className="flex h-6 border-b border-[#2B5797]">
              {yearGroups.map((yg) => (
                <div
                  key={yg.year}
                  className="flex items-center justify-center overflow-hidden border-r border-[#2B5797] text-[10px] font-bold text-white"
                  style={{ width: `${yg.widthPercent}%` }}
                >
                  {yg.year}
                </div>
              ))}
            </div>
            {/* 月行 */}
            <div className="flex h-5 border-b border-[#2B5797]/60">
              {monthCols.map((col) => (
                <div
                  key={`${col.year}-${col.month}`}
                  className="flex items-center justify-center overflow-hidden border-r border-[#2B5797]/40 text-[10px] font-medium text-white/90"
                  style={{ width: `${col.widthPercent}%` }}
                >
                  {col.month}月
                </div>
              ))}
            </div>
            {/* 週行 */}
            <div className="relative flex h-4">
              {weekCols.map((wc) => (
                <div
                  key={wc.week}
                  className="absolute flex items-center justify-center overflow-hidden border-r border-[#2B5797]/20 text-[10px] text-white/50"
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

      {/* 行事行 */}
      {eventLanes.map((lane) => (
        <EventsRow
          key={lane.id}
          lane={lane}
          routeStart={routeStart}
          routeEnd={routeEnd}
          totalDays={totalDays}
          monthBorders={monthBorders}
          labelWidth={LABEL_W}
          onLabelChange={onUpdateEventLane ? (label) => onUpdateEventLane(lane.id, label) : undefined}
          onRemoveLane={onRemoveEventLane ? () => onRemoveEventLane(lane.id) : undefined}
          onAddLane={onAddEventLane}
          onAddEvent={onAddLaneEvent ? (ev) => onAddLaneEvent(lane.id, ev) : undefined}
          onUpdateEvent={onUpdateLaneEvent ? (evId, changes) => onUpdateLaneEvent(lane.id, evId, changes) : undefined}
          onRemoveEvent={onRemoveLaneEvent ? (evId) => onRemoveLaneEvent(lane.id, evId) : undefined}
        />
      ))}
      {/* 行事行がない場合の追加ボタン */}
      {eventLanes.length === 0 && onAddEventLane && (
        <div className="flex shrink-0 border-b border-slate-200">
          <div className={`${LABEL_W} shrink-0 border-r border-border/30`} />
          <button
            type="button"
            className="flex h-7 flex-1 items-center justify-center gap-1 text-[10px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            onClick={() => onAddEventLane({ id: crypto.randomUUID(), label: "行事", events: [] })}
          >
            <Plus className="h-3 w-3" />
            行事行を追加
          </button>
        </div>
      )}

      {/* ガント行 */}
      <div
        className="flex-1 overflow-y-auto bg-white"
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
                  <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight px-0.5">
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
                        {/* バー（画像の0.7倍の高さ、下揃え） */}
                        <div
                          className={cn(
                            "absolute left-0 right-0 bottom-0 flex items-center rounded-sm",
                            isSelected && "ring-2 ring-blue-400 ring-offset-1",
                          )}
                          style={{
                            height: `${Math.round(IMG_H * 0.7)}px`,
                            backgroundColor: item.color,
                            clipPath:
                              "polygon(5px 0, calc(100% - 5px) 0, 100% 50%, calc(100% - 5px) 100%, 5px 100%, 0 50%)",
                          }}
                        >
                          <div
                            className="flex h-full items-center overflow-hidden"
                            style={{
                              paddingLeft: hasImage ? `${IMG_W + IMG_GAP + 4}px` : "12px",
                              paddingRight: "12px",
                            }}
                          >
                            <span
                              className="truncate text-[10px] font-medium leading-none"
                              style={{ color: textColorFor(item.color) }}
                            >
                              {item.title}
                            </span>
                          </div>
                        </div>

                        {/* 表紙画像 */}
                        {hasImage && (
                          <img
                            src={item.coverImageUrl!}
                            alt=""
                            className="absolute left-0 bottom-0 border border-white/70 object-cover shadow-sm"
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
        {/* 追加行 */}
        {items.length > 0 && onAddClick && (
          <div
            data-print-hide
            className="flex h-6 cursor-pointer items-center justify-center gap-1 border-b border-dashed border-border/30 text-[9px] text-muted-foreground hover:bg-slate-50 hover:text-[#4472C4] transition-colors"
            onClick={() => onAddClick()}
          >
            <Plus className="h-4 w-4" />
            教材を追加
          </div>
        )}
      </div>
    </div>
  );
}

/** 行事行コンポーネント（1レーン分） */
function EventsRow({
  lane,
  routeStart,
  routeEnd,
  totalDays,
  monthBorders,
  labelWidth,
  onLabelChange,
  onRemoveLane,
  onAddLane,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
}: {
  lane: EventLane;
  routeStart: Date;
  routeEnd: Date;
  totalDays: number;
  monthBorders: number[];
  labelWidth: string;
  onLabelChange?: (label: string) => void;
  onRemoveLane?: () => void;
  onAddLane?: (lane: EventLane) => void;
  onAddEvent?: (event: RouteEvent) => void;
  onUpdateEvent?: (eventId: string, changes: Partial<RouteEvent>) => void;
  onRemoveEvent?: (eventId: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [evStart, setEvStart] = useState("");
  const [evEnd, setEvEnd] = useState("");
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [labelOpen, setLabelOpen] = useState(false);
  const [laneLabel, setLaneLabel] = useState(lane.label);

  function handleAdd() {
    if (!label.trim() || !evStart || !evEnd || !onAddEvent) return;
    onAddEvent({ id: crypto.randomUUID(), label: label.trim(), startDate: evStart, endDate: evEnd, color });
    setLabel("");
    setEvStart("");
    setEvEnd("");
    setColor(EVENT_COLORS[0]);
    setAddOpen(false);
  }

  function handleLabelSave() {
    if (laneLabel.trim() && onLabelChange) onLabelChange(laneLabel.trim());
    setLabelOpen(false);
  }

  const minDate = toISODate(routeStart);
  const maxDate = toISODate(routeEnd);

  return (
    <div className="flex shrink-0 border-b border-slate-200 bg-slate-50/80 group/lane">
      {/* ラベル（クリックで編集） */}
      <Popover open={labelOpen} onOpenChange={(v) => { setLabelOpen(v); if (v) setLaneLabel(lane.label); }}>
        <PopoverTrigger asChild>
          <div className={`${labelWidth} shrink-0 border-r border-border/30 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors`}>
            <span className="text-[8px] text-slate-400 text-center leading-tight px-0.5 truncate">{lane.label}</span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start" side="right">
          <div className="space-y-2">
            <input
              type="text"
              value={laneLabel}
              onChange={(e) => setLaneLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLabelSave(); }}
              className="flex h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="flex h-7 flex-1 items-center justify-center rounded bg-[#1F3864] text-xs text-white hover:bg-[#2B5797]"
                onClick={handleLabelSave}
              >
                変更
              </button>
              {onRemoveLane && (
                <button
                  type="button"
                  className="flex h-7 items-center justify-center rounded border border-red-200 px-2 text-xs text-red-500 hover:bg-red-50"
                  onClick={() => { onRemoveLane(); setLabelOpen(false); }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {onAddLane && (
              <button
                type="button"
                className="flex h-7 w-full items-center justify-center gap-1 rounded border border-dashed border-slate-300 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                onClick={() => {
                  onAddLane({ id: crypto.randomUUID(), label: "行事", events: [] });
                  setLabelOpen(false);
                }}
              >
                <Plus className="h-3 w-3" />
                下に行を追加
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {/* タイムライン */}
      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex-1 min-w-0 h-5 cursor-pointer hover:bg-slate-100/60 transition-colors">
            {/* 月境界線 */}
            {monthBorders.map((pct, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-r border-border/20 pointer-events-none"
                style={{ left: `${pct}%` }}
              />
            ))}
            {/* イベントピル */}
            {lane.events.map((ev) => {
              const leftPct = dateToPercent(ev.startDate, routeStart, totalDays);
              const rightPct = dateToPercent(ev.endDate, routeStart, totalDays);
              if (rightPct < 0 || leftPct > 100) return null;
              const widthPct = Math.max(rightPct - leftPct, 0.5);
              return (
                <EventPill
                  key={ev.id}
                  event={ev}
                  leftPct={Math.max(leftPct, 0)}
                  widthPct={widthPct}
                  minDate={minDate}
                  maxDate={maxDate}
                  onUpdate={onUpdateEvent}
                  onRemove={onRemoveEvent}
                />
              );
            })}
            {/* 空の時のヒント */}
            {lane.events.length === 0 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300 pointer-events-none">
                クリックして追加
              </span>
            )}
          </div>
        </PopoverTrigger>
        {onAddEvent && (
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{lane.label}を追加</p>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="中間テスト、模試など"
                className="flex h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground">開始日</label>
                  <input
                    type="date"
                    value={evStart}
                    onChange={(e) => { setEvStart(e.target.value); if (!evEnd || e.target.value > evEnd) setEvEnd(e.target.value); }}
                    min={minDate}
                    max={maxDate}
                    className="flex h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">終了日</label>
                  <input
                    type="date"
                    value={evEnd}
                    onChange={(e) => setEvEnd(e.target.value)}
                    min={evStart || minDate}
                    max={maxDate}
                    className="flex h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
                  />
                </div>
              </div>
              <div className="flex gap-1">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                      color === c ? "border-foreground scale-110" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="flex h-8 w-full items-center justify-center rounded bg-[#1F3864] text-sm font-medium text-white hover:bg-[#2B5797] disabled:opacity-50"
                disabled={!label.trim() || !evStart || !evEnd}
                onClick={handleAdd}
              >
                追加
              </button>
            </div>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

/** イベントピル（クリックで編集） */
function EventPill({
  event,
  leftPct,
  widthPct,
  minDate,
  maxDate,
  onUpdate,
  onRemove,
}: {
  event: RouteEvent;
  leftPct: number;
  widthPct: number;
  minDate: string;
  maxDate: string;
  onUpdate?: (eventId: string, changes: Partial<RouteEvent>) => void;
  onRemove?: (eventId: string) => void;
}) {
  const [editLabel, setEditLabel] = useState(event.label);
  const [editStart, setEditStart] = useState(event.startDate);
  const [editEnd, setEditEnd] = useState(event.endDate);
  const [editColor, setEditColor] = useState(event.color);
  const [open, setOpen] = useState(false);

  function handleOpenChange(v: boolean) {
    if (v) {
      setEditLabel(event.label);
      setEditStart(event.startDate);
      setEditEnd(event.endDate);
      setEditColor(event.color);
    }
    setOpen(v);
  }

  function handleSave() {
    if (!editLabel.trim() || !editStart || !editEnd || !onUpdate) return;
    onUpdate(event.id, { label: editLabel.trim(), startDate: editStart, endDate: editEnd, color: editColor });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute top-0.5 z-[1] flex h-4 items-center justify-center rounded-full px-1 text-[8px] font-medium text-white shadow-sm hover:brightness-110 transition-all cursor-pointer"
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            minWidth: "24px",
            backgroundColor: event.color,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate">{event.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="center">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">行事を編集</p>
          <input
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="flex h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground">開始日</label>
              <input
                type="date"
                value={editStart}
                onChange={(e) => { setEditStart(e.target.value); if (e.target.value > editEnd) setEditEnd(e.target.value); }}
                min={minDate}
                max={maxDate}
                className="flex h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">終了日</label>
              <input
                type="date"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                min={editStart || minDate}
                max={maxDate}
                className="flex h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4472C4]"
              />
            </div>
          </div>
          <div className="flex gap-1">
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                  editColor === c ? "border-foreground scale-110" : "border-transparent",
                )}
                style={{ backgroundColor: c }}
                onClick={() => setEditColor(c)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex h-8 flex-1 items-center justify-center rounded bg-[#1F3864] text-sm font-medium text-white hover:bg-[#2B5797] disabled:opacity-50"
              disabled={!editLabel.trim() || !editStart || !editEnd}
              onClick={handleSave}
            >
              保存
            </button>
            {onRemove && (
              <button
                type="button"
                className="flex h-8 items-center justify-center rounded border border-red-200 px-3 text-sm text-red-500 hover:bg-red-50"
                onClick={() => { onRemove(event.id); setOpen(false); }}
              >
                削除
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
