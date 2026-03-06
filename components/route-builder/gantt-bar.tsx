"use client";

import { cn } from "@/lib/utils";
import { shortDate } from "@/lib/date-utils";

/** HEX色の明るさを判定し、明るければ黒文字、暗ければ白文字を返す */
export function textColorFor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // W3C相対輝度の簡易版
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}

function stars(count: number) {
  return "★".repeat(count) + "☆".repeat(5 - count);
}

type GanttBarProps = {
  title: string;
  subject: string;
  fields: string[];
  color: string;
  difficulty: number;
  importance: number;
  memo: string;
  totalPages: number;
  targetRounds: number;
  coverImageUrl: string | null;
  startDate: string;
  endDate: string;
  leftPercent: number;
  widthPercent: number;
  isSelected: boolean;
};

/** 画像幅(px) + gap */
const IMG_W = 54;
const IMG_GAP = 3;
const IMG_OFFSET = IMG_W + IMG_GAP;

export function GanttBar({
  title,
  subject,
  fields,
  color,
  difficulty,
  importance,
  memo,
  totalPages,
  targetRounds,
  coverImageUrl,
  startDate,
  endDate,
  leftPercent,
  widthPercent,
  isSelected,
}: GanttBarProps) {
  const hasImage = !!coverImageUrl;
  const labelLeft = hasImage ? `${IMG_OFFSET}px` : "2px";

  return (
    <div
      className="absolute bottom-2"
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        minWidth: "48px",
      }}
    >
      {/* 情報ラベル（バーの上、画像の右から） */}
      <div
        className="absolute bottom-full mb-0.5 flex flex-col gap-0.5 whitespace-nowrap"
        style={{ left: labelLeft }}
      >
        {/* 科目□ + 分野タグ + 日付 + 目的 */}
        <div className="flex items-center gap-1.5">
          {subject && (
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-sm font-bold leading-none"
              style={{ backgroundColor: color, color: textColorFor(color) }}
            >
              {subject}
            </span>
          )}
          {fields.map((f) => (
            <span
              key={f}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs leading-none text-black"
              style={{ backgroundColor: color + "20", borderWidth: 1, borderColor: color + "50" }}
            >
              {f}
            </span>
          ))}
          <span className="text-sm leading-none text-black">
            {shortDate(startDate)}〜{shortDate(endDate)}
          </span>
          <span className="text-sm leading-none text-black/30">│</span>
          {memo ? (
            <span className="max-w-[270px] truncate text-sm leading-none text-black">
              <span className="font-medium">目的：</span>{memo}
            </span>
          ) : (
            <span className="text-sm leading-none text-black/30">目的：-</span>
          )}
        </div>
        {/* ★ + 目標周回 */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none text-amber-500">
            難{stars(difficulty)}
          </span>
          <span className="text-sm leading-none text-rose-400">
            重{stars(importance)}
          </span>
          <span className="text-sm leading-none text-black/30">│</span>
          {targetRounds > 1 ? (
            <span className="text-sm leading-none text-black">
              <span className="font-medium">目標：</span>
              {targetRounds}周{totalPages > 0 && <span className="text-black/60"> ({totalPages}p)</span>}
            </span>
          ) : (
            <span className="text-sm leading-none text-black/30">目標：-</span>
          )}
        </div>
      </div>

      {/* 矢印型バー本体 */}
      <div
        className={cn(
          "h-9 w-full transition-all",
          isSelected ? "drop-shadow-md brightness-110" : "hover:brightness-110",
        )}
        style={{
          backgroundColor: color,
          clipPath: "polygon(9px 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 9px 100%, 0 50%)",
        }}
      >
        <div
          className="flex h-full items-center overflow-hidden"
          style={{ paddingLeft: hasImage ? `${IMG_OFFSET + 6}px` : "18px", paddingRight: "18px" }}
        >
          <span
            className="truncate text-base font-medium leading-none"
            style={{ color: textColorFor(color) }}
          >
            {title}
          </span>
        </div>
      </div>

      {/* 表紙画像（バー先頭に重ねて配置、行の上下いっぱい） */}
      {coverImageUrl && (
        <img
          src={coverImageUrl}
          alt=""
          className="absolute left-0 bottom-0 rounded-sm border border-white/70 object-cover shadow-sm"
          style={{ height: "78px", width: `${IMG_W}px` }}
        />
      )}
    </div>
  );
}
